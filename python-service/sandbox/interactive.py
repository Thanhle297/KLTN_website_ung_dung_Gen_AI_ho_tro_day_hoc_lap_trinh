# =====================================================
# Interactive sandbox runner (process con với Pipe)
# Dùng cho WebSocket interactive terminal
# =====================================================
import builtins
import io
import os
import sys
import traceback
from typing import Dict, Any

from sandbox.limits import apply_limits


def run_code_interactive(
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
        apply_limits(cpu_seconds=cpu_seconds, mem_mb=mem_mb)
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
