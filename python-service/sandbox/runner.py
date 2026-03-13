# =====================================================
# Batch sandbox runner (process con với Queue)
# - Kill cứng nếu infinite loop nhờ parent terminate/kill
# - Giới hạn CPU time / RAM (Linux) để chống ăn tài nguyên
# - Giới hạn số lần input() để tránh treo chờ input
# - Giới hạn output để tránh spam stdout
# =====================================================
import builtins
import io
import multiprocessing as mp
import sys
import traceback
from typing import Dict, Any

from config import (
    DEFAULT_TIMEOUT_SEC,
    DEFAULT_CPU_SECONDS,
    DEFAULT_MEM_MB,
    MAX_INPUT_CALLS_DEFAULT,
    MAX_OUTPUT_CHARS_DEFAULT,
)
from sandbox.limits import apply_limits


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
        apply_limits(cpu_seconds=cpu_seconds, mem_mb=mem_mb)
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
