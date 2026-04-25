# =====================================================
# WebSocket endpoint: /ws/run_simple
# Interactive terminal cho Simple mode
# =====================================================
import asyncio
import json
import multiprocessing as mp

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import (
    DEFAULT_TIMEOUT_SEC,
    DEFAULT_CPU_SECONDS,
    DEFAULT_MEM_MB,
    MAX_INPUT_CALLS_DEFAULT,
    MAX_OUTPUT_CHARS_DEFAULT,
    MAX_WAITING_REQUESTS,
)
from concurrency import sandbox_semaphore, inc_waiting, dec_waiting, get_waiting
from sandbox.interactive import run_code_interactive

router = APIRouter()


async def _listen_ws_stop(
    websocket: WebSocket,
    process: mp.Process,
    stop_event: asyncio.Event,
    input_queue: asyncio.Queue,
):
    """Task chạy song song: lắng nghe WS message 'stop' hoặc disconnect.
    Khi nhận stop → kill process ngay, set event để relay loop biết.
    """
    try:
        while not stop_event.is_set():
            raw = await websocket.receive_text()
            ws_msg = json.loads(raw)
            if ws_msg.get("type") == "stop":
                # Kill process ngay lập tức
                if process.is_alive():
                    try:
                        process.terminate()
                    except Exception:
                        pass
                    try:
                        process.kill()
                    except Exception:
                        pass
                stop_event.set()
                return
            elif ws_msg.get("type") == "input":
                # Đẩy input message vào queue để relay loop xử lý
                await input_queue.put(ws_msg)
    except (WebSocketDisconnect, Exception):
        # WS đóng hoặc lỗi → kill process
        if process.is_alive():
            try:
                process.terminate()
            except Exception:
                pass
            try:
                process.kill()
            except Exception:
                pass
        stop_event.set()


async def _relay_pipe_to_ws(
    websocket: WebSocket,
    parent_conn,
    process: mp.Process,
) -> str:
    """Relay giữa child process (Pipe) và WebSocket client.
    Trả về toàn bộ output đã thu thập (cho AI grading).
    Chạy song song với _listen_ws_stop để kill process ngay khi user bấm Stop.
    """
    loop = asyncio.get_running_loop()
    total_output = []

    # Event + queue để giao tiếp giữa WS listener và relay loop
    stop_event = asyncio.Event()
    input_queue = asyncio.Queue()

    # Chạy WS listener song song
    ws_listener_task = asyncio.create_task(
        _listen_ws_stop(websocket, process, stop_event, input_queue)
    )

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

    try:
        while True:
            # Kiểm tra stop event trước mỗi lần đọc pipe
            if stop_event.is_set():
                try:
                    await websocket.send_json({
                        "type": "error",
                        "data": "[Đã dừng chương trình]",
                        "output": "".join(total_output),
                    })
                except Exception:
                    pass
                break

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
                if stop_event.is_set():
                    # Bị kill bởi stop → gửi thông báo dừng
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "data": "[Đã dừng chương trình]",
                            "output": "".join(total_output),
                        })
                    except Exception:
                        pass
                else:
                    # Child process chết tự nhiên (code chạy xong)
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

                # Chờ input từ WS listener (qua queue) hoặc stop event
                try:
                    ws_msg = await asyncio.wait_for(
                        input_queue.get(),
                        timeout=300  # 5 phút chờ user nhập
                    )
                    if ws_msg.get("type") == "input":
                        parent_conn.send({"data": ws_msg["data"]})
                        # Echo input + newline vào output (giống terminal thật)
                        total_output.append(ws_msg["data"] + "\n")
                except asyncio.TimeoutError:
                    # Quá lâu không nhập
                    if process.is_alive():
                        try:
                            process.terminate()
                        except Exception:
                            pass
                    break

                # Kiểm tra stop event sau khi chờ input
                if stop_event.is_set():
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "data": "[Đã dừng chương trình]",
                            "output": "".join(total_output),
                        })
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
    finally:
        # Hủy WS listener task
        ws_listener_task.cancel()
        try:
            await ws_listener_task
        except (asyncio.CancelledError, Exception):
            pass

    return "".join(total_output)


@router.websocket("/ws/run_simple")
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
            waiting = await get_waiting()
            if waiting >= MAX_WAITING_REQUESTS:
                await websocket.send_json({
                    "type": "error",
                    "data": "Hệ thống đang quá tải. Vui lòng thử lại sau ít giây.",
                })
                await websocket.close()
                return

        await inc_waiting()
        try:
            async with sandbox_semaphore:
                # 3. Spawn child process với Pipe (2 chiều)
                parent_conn, child_conn = mp.Pipe()
                process = mp.Process(
                    target=run_code_interactive,
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
            await dec_waiting()

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
