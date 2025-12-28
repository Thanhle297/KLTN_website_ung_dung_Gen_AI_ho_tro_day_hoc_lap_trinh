from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import multiprocessing
import sys
import io
import traceback
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
import builtins

# =====================================================
# 1. Cấu hình FastAPI
# =====================================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# 2. Model dữ liệu
# =====================================================
class TestCase(BaseModel):
    input: str
    expected: str

class CodeRequest(BaseModel):
    code: str
    testcases: List[TestCase]
    echo_input: bool = False   # ✔ echo_input toàn câu hỏi

class SimpleCodeRequest(BaseModel):
    code: str
    input: str = ""

# =====================================================
# 3. Hàm chạy code trong process
# =====================================================
def run_code(code: str, input_data: str, echo_input: bool):
    """
    Chạy code Python trong process riêng biệt.
    Hỗ trợ:
    - Redirect stdin từ input_data
    - Ghi stdout vào buffer
    - Giả lập input() với echo_input theo từng câu hỏi
    """

    old_stdout = sys.stdout
    old_stdin = sys.stdin
    old_input = builtins.input

    sys.stdout = buffer = io.StringIO()
    sys.stdin = io.StringIO(input_data)

    def fake_input(prompt: str = "") -> str:
        line = sys.stdin.readline()
        if line == "":
            raise EOFError("Hết dữ liệu input")

        value = line.rstrip("\n")

        # ✔ Nếu echo_input = True → in prompt + value giống console
        if echo_input:
            print(f"{prompt}{value}")

        return value

    builtins.input = fake_input

    try:
        exec(code, {})
        return {"output": buffer.getvalue()}
    except Exception:
        return {"error": traceback.format_exc()}
    finally:
        sys.stdout = old_stdout
        sys.stdin = old_stdin
        builtins.input = old_input

# =====================================================
# 4. API execute (chấm điểm)
# =====================================================
@app.post("/execute")
def execute_code(request: CodeRequest):
    start_time = time.perf_counter()

    n = len(request.testcases)
    results = [None] * n
    num_workers = multiprocessing.cpu_count()
    timeout = 5

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        future_to_tc = {
            executor.submit(run_code, request.code, tc.input, request.echo_input): (i, tc)
            for i, tc in enumerate(request.testcases)
        }

        try:
            for future in as_completed(future_to_tc, timeout=timeout * n):
                index, tc = future_to_tc[future]
                try:
                    result = future.result(timeout=timeout)

                    if "output" in result:
                        result["passed"] = (result["output"].strip() == tc.expected.strip())

                    result["input"] = tc.input
                    result["expected"] = tc.expected
                    results[index] = result

                except Exception as e:
                    results[index] = {
                        "input": tc.input,
                        "expected": tc.expected,
                        "error": f"Lỗi/Timeout: {str(e)}"
                    }

        except Exception as e:
            for i, tc in enumerate(request.testcases):
                if results[i] is None:
                    results[i] = {
                        "input": tc.input,
                        "expected": tc.expected,
                        "error": f"Lỗi/Timeout tổng: {str(e)}"
                    }

    elapsed = time.perf_counter() - start_time
    print(f"[INFO] /execute xử lý {n} testcases trong {elapsed:.3f}s")

    return {"results": results}


# =====================================================
# 5. API IDE: run_code_simple
# =====================================================
@app.post("/run_code_simple")
def run_code_simple(request: SimpleCodeRequest):
    try:
        with ProcessPoolExecutor(max_workers=1) as executor:
            future = executor.submit(run_code, request.code, request.input, False)
            result = future.result(timeout=5)

        if "error" in result:
            return {"success": False, "error": result["error"]}

        return {"success": True, "output": result["output"] or "(Không có kết quả)"}

    except Exception as e:
        return {"success": False, "error": f"Lỗi khi chạy code: {str(e)}"}

# =====================================================
# Health check
# =====================================================
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# =====================================================
# Run server
# =====================================================
if __name__ == "__main__":
    import uvicorn
    multiprocessing.freeze_support()
    uvicorn.run(app, host="0.0.0.0", port=8001)
