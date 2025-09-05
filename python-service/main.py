from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import multiprocessing
import sys
import io
import traceback

# =====================================================
# 1. Cấu hình FastAPI
# =====================================================
app = FastAPI()

# Cho phép CORS (frontend Node/React gọi được API này)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# 2. Khai báo model dữ liệu (input từ Node.js)
# =====================================================
class TestCase(BaseModel):
    input: str       # dữ liệu nhập cho testcase
    expected: str    # kết quả mong muốn

class CodeRequest(BaseModel):
    code: str                # đoạn code Python do user gửi
    testcases: List[TestCase]  # danh sách test case

# =====================================================
# 3. Hàm chạy code trong process riêng
# =====================================================
def run_code(code: str, input_data: str, queue: multiprocessing.Queue):
    """
    Hàm này chạy trong 1 process riêng biệt.
    Nó sẽ:
    - redirect stdin, stdout
    - chạy exec(code)
    - ghi lại output hoặc error vào queue
    """
    old_stdout = sys.stdout
    old_stdin = sys.stdin
    sys.stdout = buffer = io.StringIO()

    try:
        sys.stdin = io.StringIO(input_data)   # gán input
        exec(code, {})                        # chạy code trong môi trường mới
        output = buffer.getvalue()
        queue.put({"output": output})
    except Exception:
        error = traceback.format_exc()
        queue.put({"error": error})
    finally:
        sys.stdout = old_stdout
        sys.stdin = old_stdin


# =====================================================
# 4. API chính: /execute
# =====================================================
@app.post("/execute")
def execute_code(request: CodeRequest):
    results = []

    for tc in request.testcases:
        queue = multiprocessing.Queue()

        # ✅ phải truyền tuple (request.code, tc.input, queue)
        process = multiprocessing.Process(
            target=run_code,
            args=(request.code, tc.input, queue)
        )

        process.start()
        process.join(timeout=5)  # giới hạn 5s

        if process.is_alive():
            process.terminate()
            results.append({
                "input": tc.input,
                "expected": tc.expected,
                "error": "Timeout: Code chạy quá lâu"
            })
            continue

        if not queue.empty():
            result = queue.get()
            # nếu có expected -> so sánh
            if "output" in result:
                result["passed"] = (result["output"].strip() == tc.expected.strip())
            result["input"] = tc.input
            result["expected"] = tc.expected
            results.append(result)
        else:
            results.append({
                "input": tc.input,
                "expected": tc.expected,
                "error": "Không có output trả về"
            })

    return {"results": results}

# =========================
# Health check
# =========================
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# =====================================================
# 5. Chạy uvicorn server (nếu chạy trực tiếp)
# =====================================================
if __name__ == "__main__":
    import uvicorn
    multiprocessing.freeze_support()  # fix lỗi trên Windows
    uvicorn.run(app, host="0.0.0.0", port=8001)
