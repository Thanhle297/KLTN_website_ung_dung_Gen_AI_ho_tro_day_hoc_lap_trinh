from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import builtins
import io
import multiprocessing as mp
import sys
import traceback
import time
import os
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

# Linux-only (giới hạn CPU/RAM trong process con)
try:
    import resource  # type: ignore
    HAS_RESOURCE = True
except Exception:
    HAS_RESOURCE = False

# =====================================================
# 0) Runtime config (tùy chỉnh bằng ENV nếu cần)
# =====================================================
# VPS 8GB / 4 CPU: khuyến nghị 8 sandbox đồng thời
MAX_CONCURRENT_SANDBOX = int(os.getenv("MAX_CONCURRENT_SANDBOX", "8"))

# Giới hạn mặc định cho mỗi lần chạy (có thể override theo endpoint nếu muốn)
DEFAULT_TIMEOUT_SEC = int(os.getenv("DEFAULT_TIMEOUT_SEC", "15"))
DEFAULT_CPU_SECONDS = int(os.getenv("DEFAULT_CPU_SECONDS", "15"))
DEFAULT_MEM_MB = int(os.getenv("DEFAULT_MEM_MB", "512"))

MAX_INPUT_CALLS_DEFAULT = int(os.getenv("MAX_INPUT_CALLS_DEFAULT", "200"))
MAX_OUTPUT_CHARS_DEFAULT = int(os.getenv("MAX_OUTPUT_CHARS_DEFAULT", "200000"))

# Option: giới hạn số request đang chờ (tránh queue vô hạn khi cả trường bấm cùng lúc)
# Nếu vượt -> trả 429 nhanh. 0 = tắt giới hạn.
MAX_WAITING_REQUESTS = int(os.getenv("MAX_WAITING_REQUESTS", "0"))

# =====================================================
# 1) FastAPI config
# =====================================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khuyến nghị để tránh fork phức tạp trong môi trường server
try:
    mp.set_start_method("spawn", force=True)
except Exception:
    pass

# =====================================================
# 1.1) Global concurrency control (đúng luồng nghiệp vụ)
# - Semaphore: giới hạn số sandbox chạy đồng thời
# - ThreadPoolExecutor: offload safe_run (blocking) khỏi event loop
# =====================================================
thread_pool = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_SANDBOX)
sandbox_semaphore = asyncio.Semaphore(MAX_CONCURRENT_SANDBOX)

# Đếm số request đang chờ (OPTIONAL)
_waiting_lock = asyncio.Lock()
_waiting_requests = 0

async def _inc_waiting() -> None:
    global _waiting_requests
    async with _waiting_lock:
        _waiting_requests += 1

async def _dec_waiting() -> None:
    global _waiting_requests
    async with _waiting_lock:
        _waiting_requests = max(0, _waiting_requests - 1)

async def _get_waiting() -> int:
    async with _waiting_lock:
        return _waiting_requests


# =====================================================
# 2) Request models
# =====================================================
class TestCase(BaseModel):
    input: str
    expected: str


class CodeRequest(BaseModel):
    code: str
    testcases: List[TestCase]
    echo_input: bool = False


class SimpleCodeRequest(BaseModel):
    code: str
    input: str = ""
    echo_input: bool = True


# =====================================================
# 3) Sandbox runner (process con)
#    - Kill cứng nếu infinite loop nhờ parent terminate/kill
#    - Giới hạn CPU time / RAM (Linux) để chống ăn tài nguyên
#    - Giới hạn số lần input() để tránh treo chờ input
#    - Giới hạn output để tránh spam stdout
# =====================================================
def _apply_limits(cpu_seconds: int, mem_mb: int) -> None:
    """Áp dụng giới hạn tài nguyên trong process con (Linux)."""
    if not HAS_RESOURCE:
        return

    # CPU time
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds))

    # Virtual memory (address space)
    mem_bytes = mem_mb * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))

    # No core dump
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))


def _run_code_in_child(
    queue: "mp.Queue",
    code: str,
    input_data: str,
    echo_input: bool,
    cpu_seconds: int,
    mem_mb: int,
    max_input_calls: int,
    max_output_chars: int,
) -> None:
    """Chạy code Python trong process con, trả kết quả qua queue."""
    # Giới hạn tài nguyên
    try:
        _apply_limits(cpu_seconds=cpu_seconds, mem_mb=mem_mb)
    except Exception:
        # Nếu setrlimit fail thì vẫn chạy; parent vẫn kill theo timeout
        pass

    old_stdout = sys.stdout
    old_stdin = sys.stdin
    old_input = builtins.input

    buffer = io.StringIO()
    sys.stdout = buffer
    sys.stdin = io.StringIO(input_data)

    input_calls = 0

    def fake_input(prompt: str = "") -> str:
        nonlocal input_calls
        input_calls += 1
        if input_calls > max_input_calls:
            raise RuntimeError("Vượt quá số lần gọi input() cho phép")

        line = sys.stdin.readline()
        if line == "":
            raise EOFError("Hết dữ liệu input")

        value = line.rstrip("\n")

        if echo_input:
            # giả lập console: in prompt + giá trị nhập
            print(f"{prompt}{value}")

        return value

    builtins.input = fake_input

    try:
        # Chạy trong global riêng để giảm rò rỉ trạng thái
        g: Dict[str, Any] = {}
        exec(code, g)

        out = buffer.getvalue()
        if len(out) > max_output_chars:
            out = out[:max_output_chars] + "\n[OUTPUT_TRUNCATED]"

        queue.put({"output": out})

    except MemoryError:
        queue.put({"error": "Chương trình vượt giới hạn bộ nhớ (Memory limit)."})
    except Exception:
        queue.put({"error": traceback.format_exc()})
    finally:
        sys.stdout = old_stdout
        sys.stdin = old_stdin
        builtins.input = old_input


def safe_run(
    code: str,
    input_data: str,
    echo_input: bool,
    timeout_sec: int = DEFAULT_TIMEOUT_SEC,
    cpu_seconds: int = DEFAULT_CPU_SECONDS,
    mem_mb: int = DEFAULT_MEM_MB,
    max_input_calls: int = MAX_INPUT_CALLS_DEFAULT,
    max_output_chars: int = MAX_OUTPUT_CHARS_DEFAULT,
) -> Dict[str, Any]:
    """Chạy code trong process riêng + kill cứng nếu quá thời gian."""
    q: mp.Queue = mp.Queue()
    p = mp.Process(
        target=_run_code_in_child,
        args=(
            q,
            code,
            input_data,
            echo_input,
            cpu_seconds,
            mem_mb,
            max_input_calls,
            max_output_chars,
        ),
        daemon=True,
    )

    p.start()
    p.join(timeout=timeout_sec)

    if p.is_alive():
        # terminate + kill để chắc chắn dừng
        try:
            p.terminate()
        except Exception:
            pass
        try:
            p.kill()
        except Exception:
            pass
        try:
            p.join(timeout=1)
        except Exception:
            pass
        return {"error": "Chương trình chạy quá thời gian (infinite loop / treo).", "timeout": True}

    if q.empty():
        return {"error": "Không nhận được kết quả từ process.", "timeout": False}

    return q.get()


# =====================================================
# 4) Concurrency wrapper: giới hạn sandbox đồng thời
# =====================================================
async def run_sandbox_limited(
    code: str,
    input_data: str,
    echo_input: bool,
    timeout_sec: int = DEFAULT_TIMEOUT_SEC,
    cpu_seconds: int = DEFAULT_CPU_SECONDS,
    mem_mb: int = DEFAULT_MEM_MB,
) -> Dict[str, Any]:
    """
    - Xếp hàng bằng semaphore (giới hạn số sandbox chạy đồng thời).
    - Chạy safe_run (blocking) trong ThreadPool để không block event loop.
    """
    # OPTIONAL: chặn nhanh nếu queue quá dài
    if MAX_WAITING_REQUESTS > 0:
        waiting = await _get_waiting()
        # waiting ở đây chỉ là counter tương đối, mục tiêu: tránh overrun khi đột biến
        if waiting >= MAX_WAITING_REQUESTS:
            return {
                "error": "Hệ thống đang quá tải. Vui lòng thử lại sau ít giây.",
                "overloaded": True,
            }

    await _inc_waiting()
    try:
        async with sandbox_semaphore:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                thread_pool,
                safe_run,
                code,
                input_data,
                echo_input,
                timeout_sec,
                cpu_seconds,
                mem_mb,
                MAX_INPUT_CALLS_DEFAULT,
                MAX_OUTPUT_CHARS_DEFAULT,
            )
    finally:
        await _dec_waiting()


# =====================================================
# 5) API execute (chấm testcases) - SONG SONG CÓ KIỂM SOÁT
#    - Trong 1 request: các testcases chạy đồng thời nhưng vẫn bị giới hạn bởi semaphore
#    - Nhiều request từ nhiều học sinh: cùng chia sẻ semaphore -> hệ thống ổn định
# =====================================================
@app.post("/execute")
async def execute_code(request: CodeRequest):
    start_time = time.perf_counter()

    # Tham số an toàn (tùy bạn chỉnh/đưa ENV)
    PER_TEST_TIMEOUT = DEFAULT_TIMEOUT_SEC
    CPU_SECONDS = DEFAULT_CPU_SECONDS
    MEM_MB = DEFAULT_MEM_MB

    tasks = [
        run_sandbox_limited(
            code=request.code,
            input_data=tc.input,
            echo_input=request.echo_input,
            timeout_sec=PER_TEST_TIMEOUT,
            cpu_seconds=CPU_SECONDS,
            mem_mb=MEM_MB,
        )
        for tc in request.testcases
    ]

    raw_results = await asyncio.gather(*tasks)

    results: List[Dict[str, Any]] = []
    for r, tc in zip(raw_results, request.testcases):
        if "output" in r:
            r["passed"] = (r["output"].strip() == tc.expected.strip())

        r["input"] = tc.input
        r["expected"] = tc.expected
        results.append(r)

    elapsed = time.perf_counter() - start_time
    print(
        f"[INFO] /execute xử lý {len(results)} testcases trong {elapsed:.3f}s | "
        f"MAX_CONCURRENT_SANDBOX={MAX_CONCURRENT_SANDBOX}"
    )

    return {
        "results": results,
        "meta": {
            "count": len(results),
            "elapsed_sec": round(elapsed, 3),
            "max_concurrent_sandbox": MAX_CONCURRENT_SANDBOX,
        },
    }


# =====================================================
# 6) API IDE: run_code_simple - SONG SONG CÓ KIỂM SOÁT
# =====================================================
@app.post("/run_code_simple")
async def run_code_simple(request: SimpleCodeRequest):
    r = await run_sandbox_limited(
        code=request.code,
        input_data=request.input,
        echo_input=request.echo_input,
        timeout_sec=DEFAULT_TIMEOUT_SEC,
        cpu_seconds=DEFAULT_CPU_SECONDS,
        mem_mb=DEFAULT_MEM_MB,
    )

    if "error" in r:
        return {"success": False, "error": r["error"], "meta": {k: v for k, v in r.items() if k != "error"}}

    return {"success": True, "output": r.get("output") or "(Không có kết quả)"}


# =====================================================
# Health check
# =====================================================
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "max_concurrent_sandbox": MAX_CONCURRENT_SANDBOX,
        "limits": {
            "timeout_sec": DEFAULT_TIMEOUT_SEC,
            "cpu_seconds": DEFAULT_CPU_SECONDS,
            "mem_mb": DEFAULT_MEM_MB,
            "max_input_calls": MAX_INPUT_CALLS_DEFAULT,
            "max_output_chars": MAX_OUTPUT_CHARS_DEFAULT,
        },
    }


# =====================================================
# Graceful shutdown
# =====================================================
@app.on_event("shutdown")
def _shutdown():
    try:
        thread_pool.shutdown(wait=False, cancel_futures=True)
    except Exception:
        pass


# =====================================================
# 7) Interactive sandbox runner (process con với Pipe)
#    Dùng cho WebSocket interactive terminal
# =====================================================
def _run_code_interactive(
    child_conn,     # multiprocessing.Connection (Pipe)
    code: str,
    cpu_seconds: int,
    mem_mb: int,
    max_input_calls: int,
    max_output_chars: int,
) -> None:
    """Chạy code Python trong process con, giao tiếp qua Pipe 2 chiều."""
    # Giới hạn tài nguyên
    try:
        _apply_limits(cpu_seconds=cpu_seconds, mem_mb=mem_mb)
    except Exception:
        pass

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    old_stdin = sys.stdin
    old_input = builtins.input

    total_output_chars = 0
    input_calls = 0

    # Override sys.stdout.write() để gửi output qua Pipe theo từng lần write
    class PipeStdout:
        def write(self, text):
            nonlocal total_output_chars
            if text:
                total_output_chars += len(text)
                if total_output_chars > max_output_chars:
                    child_conn.send({"type": "stdout", "data": "\n[OUTPUT_TRUNCATED]"})
                    child_conn.send({"type": "error", "data": "Output vượt giới hạn cho phép."})
                    os._exit(1)
                child_conn.send({"type": "stdout", "data": text})
        def flush(self):
            pass
        def fileno(self):
            raise io.UnsupportedOperation("fileno")

    # Override builtins.input() để tương tác qua Pipe
    def interactive_input(prompt=""):
        nonlocal input_calls
        input_calls += 1
        if input_calls > max_input_calls:
            raise RuntimeError("Vượt quá số lần gọi input() cho phép")

        # 1. Gửi prompt text (nếu có) qua stdout
        if prompt:
            child_conn.send({"type": "stdout", "data": str(prompt)})
        # 2. Gửi signal "đang chờ input"
        child_conn.send({"type": "input_request", "prompt": str(prompt)})
        # 3. Chờ nhận input từ Pipe (blocking - parent sẽ forward từ WS)
        response = child_conn.recv()  # blocking
        return response.get("data", "")

    pipe_stdout = PipeStdout()
    sys.stdout = pipe_stdout
    sys.stderr = pipe_stdout  # Redirect stderr vào cùng stream
    builtins.input = interactive_input

    try:
        g: Dict[str, Any] = {}
        exec(code, g)
        child_conn.send({"type": "done"})
    except SystemExit:
        try:
            child_conn.send({"type": "done"})
        except Exception:
            pass
    except MemoryError:
        try:
            child_conn.send({"type": "error", "data": "Chương trình vượt giới hạn bộ nhớ (Memory limit)."})
        except Exception:
            pass
    except EOFError:
        try:
            child_conn.send({"type": "error", "data": "Hết dữ liệu input (EOFError)."})
        except Exception:
            pass
    except Exception:
        try:
            # Lấy traceback nhưng giới hạn độ dài
            err_msg = traceback.format_exc()
            if len(err_msg) > 5000:
                err_msg = err_msg[:5000] + "\n[TRUNCATED]"
            child_conn.send({"type": "error", "data": err_msg})
        except Exception:
            pass
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        sys.stdin = old_stdin
        builtins.input = old_input
        try:
            child_conn.close()
        except Exception:
            pass


# =====================================================
# 8) WebSocket endpoint: /ws/run_simple
#    Interactive terminal cho Simple mode
# =====================================================
async def _relay_pipe_to_ws(
    websocket: WebSocket,
    parent_conn,
    process: mp.Process,
) -> str:
    """Relay giữa child process (Pipe) và WebSocket client.
    Trả về toàn bộ output đã thu thập (cho AI grading).
    """
    loop = asyncio.get_running_loop()
    total_output = []

    def _recv_with_process_check(conn, proc, poll_interval=0.1):
        """Đọc từ Pipe, nhưng kiểm tra process còn sống không.
        Trên Windows, nếu child process chết mà Pipe handle chưa close,
        conn.recv() sẽ block mãi mãi. Workaround: poll với timeout ngắn.
        """
        while True:
            if conn.poll(poll_interval):  # Có data sẵn sàng?
                return conn.recv()
            # Không có data -> kiểm tra process
            if not proc.is_alive():
                # Process đã chết, thử đọc lần cuối
                if conn.poll(0.5):
                    return conn.recv()
                # Không còn data -> raise EOFError
                raise EOFError("Child process đã kết thúc")

    while True:
        # Đọc từ child (blocking -> offload to thread)
        try:
            msg = await asyncio.wait_for(
                loop.run_in_executor(
                    None, _recv_with_process_check, parent_conn, process
                ),
                timeout=DEFAULT_TIMEOUT_SEC + 5  # Thêm buffer cho timeout
            )
        except asyncio.TimeoutError:
            # Code chạy quá lâu
            if process.is_alive():
                try:
                    process.terminate()
                except Exception:
                    pass
                try:
                    process.kill()
                except Exception:
                    pass
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": "Chương trình chạy quá thời gian (timeout).",
                    "output": "".join(total_output),
                })
            except Exception:
                pass
            break
        except (EOFError, OSError, BrokenPipeError):
            # Child process đã chết hoặc pipe đã đóng
            # Gửi done nếu chưa có error (code chạy xong bình thường nhưng pipe đóng trước khi gửi done)
            try:
                await websocket.send_json({
                    "type": "done",
                    "output": "".join(total_output),
                })
            except Exception:
                pass
            break

        if msg["type"] == "stdout":
            total_output.append(msg["data"])
            try:
                await websocket.send_json(msg)
            except Exception:
                break

        elif msg["type"] == "input_request":
            try:
                await websocket.send_json(msg)
            except Exception:
                break

            # Chờ user nhập từ WS
            try:
                ws_data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=300  # 5 phút chờ user nhập
                )
                ws_msg = json.loads(ws_data)

                if ws_msg.get("type") == "input":
                    parent_conn.send({"data": ws_msg["data"]})
                    # Echo input + newline vào output (giống terminal thật)
                    total_output.append(ws_msg["data"] + "\n")
                elif ws_msg.get("type") == "stop":
                    # User bấm Stop
                    if process.is_alive():
                        try:
                            process.terminate()
                        except Exception:
                            pass
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "data": "[Đã dừng chương trình]",
                            "output": "".join(total_output),
                        })
                    except Exception:
                        pass
                    break
            except (asyncio.TimeoutError, WebSocketDisconnect):
                # User disconnect hoặc quá lâu không nhập
                if process.is_alive():
                    try:
                        process.terminate()
                    except Exception:
                        pass
                break

        elif msg["type"] == "done":
            msg["output"] = "".join(total_output)
            try:
                await websocket.send_json(msg)
            except Exception:
                pass
            break

        elif msg["type"] == "error":
            msg["output"] = "".join(total_output)
            try:
                await websocket.send_json(msg)
            except Exception:
                pass
            break

    return "".join(total_output)


@app.websocket("/ws/run_simple")
async def ws_run_simple(websocket: WebSocket):
    """WebSocket endpoint cho interactive terminal (Simple mode)."""
    await websocket.accept()

    process = None
    parent_conn = None

    try:
        # 1. Nhận message đầu tiên: {"type": "start", "code": "..."}
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=30)
        start_msg = json.loads(raw)

        if start_msg.get("type") != "start" or not start_msg.get("code"):
            await websocket.send_json({
                "type": "error",
                "data": "Message không hợp lệ. Cần {type: 'start', code: '...'}",
            })
            await websocket.close()
            return

        code = start_msg["code"]

        # 2. Kiểm tra concurrency (semaphore)
        if MAX_WAITING_REQUESTS > 0:
            waiting = await _get_waiting()
            if waiting >= MAX_WAITING_REQUESTS:
                await websocket.send_json({
                    "type": "error",
                    "data": "Hệ thống đang quá tải. Vui lòng thử lại sau ít giây.",
                })
                await websocket.close()
                return

        await _inc_waiting()
        try:
            async with sandbox_semaphore:
                # 3. Spawn child process với Pipe (2 chiều)
                parent_conn, child_conn = mp.Pipe()
                process = mp.Process(
                    target=_run_code_interactive,
                    args=(
                        child_conn,
                        code,
                        DEFAULT_CPU_SECONDS,
                        DEFAULT_MEM_MB,
                        MAX_INPUT_CALLS_DEFAULT,
                        MAX_OUTPUT_CHARS_DEFAULT,
                    ),
                    daemon=True,
                )
                process.start()
                # Đóng child_conn ở parent (chỉ child dùng)
                child_conn.close()

                # 4. Relay giữa child process và WebSocket client
                await _relay_pipe_to_ws(websocket, parent_conn, process)
        finally:
            await _dec_waiting()

    except WebSocketDisconnect:
        pass
    except asyncio.TimeoutError:
        try:
            await websocket.send_json({
                "type": "error",
                "data": "Timeout: không nhận được message từ client.",
            })
        except Exception:
            pass
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "data": f"Lỗi server: {str(e)}",
            })
        except Exception:
            pass
    finally:
        # Cleanup: terminate child nếu còn sống
        if process and process.is_alive():
            try:
                process.terminate()
            except Exception:
                pass
            try:
                process.kill()
            except Exception:
                pass
            try:
                process.join(timeout=2)
            except Exception:
                pass
        if parent_conn:
            try:
                parent_conn.close()
            except Exception:
                pass
        try:
            await websocket.close()
        except Exception:
            pass


# =====================================================
# Run server
# =====================================================
if __name__ == "__main__":
    import uvicorn
    mp.freeze_support()

    # Khuyến nghị: workers=1 vì service tự spawn sandbox process.
    # Nếu muốn tăng throughput HTTP (không khuyến nghị nếu VPS yếu), có thể tăng 2,
    # nhưng phải giảm MAX_CONCURRENT_SANDBOX tương ứng để tránh quá tải.
    uvicorn.run(app, host="0.0.0.0", port=8001, workers=1)

