# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List
# import multiprocessing
# import sys
# import io
# import traceback
# import time 
# from concurrent.futures import ProcessPoolExecutor, as_completed

# # =====================================================
# # 1. Cấu hình FastAPI
# # =====================================================
# app = FastAPI()

# # Cho phép CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # =====================================================
# # 2. Model dữ liệu
# # =====================================================
# class TestCase(BaseModel):
#     input: str
#     expected: str

# class CodeRequest(BaseModel):
#     code: str
#     testcases: List[TestCase]

# # =====================================================
# # 3. Hàm chạy code trong process
# # =====================================================
# def run_code(code: str, input_data: str):
#     """
#     Hàm chạy trong process riêng, trả về output hoặc error
#     """
#     old_stdout = sys.stdout
#     old_stdin = sys.stdin
#     sys.stdout = buffer = io.StringIO()

#     try:
#         sys.stdin = io.StringIO(input_data)
#         exec(code, {})
#         output = buffer.getvalue()
#         return {"output": output}
#     except Exception:
#         error = traceback.format_exc()
#         return {"error": error}
#     finally:
#         sys.stdout = old_stdout
#         sys.stdin = old_stdin

# # =====================================================
# # 4. API chính: /execute
# # =====================================================
# @app.post("/execute")
# def execute_code(request: CodeRequest):
#     start_time = time.perf_counter()

#     results = []
#     num_workers = multiprocessing.cpu_count()  # số core khả dụng trên VPS/máy
#     timeout = 5  # timeout mỗi test case

#     with ProcessPoolExecutor(max_workers=num_workers) as executor:
#         future_to_tc = {
#             executor.submit(run_code, request.code, tc.input): tc for tc in request.testcases
#         }

#         for future in as_completed(future_to_tc, timeout=timeout * len(request.testcases)):
#             tc = future_to_tc[future]
#             try:
#                 result = future.result(timeout=timeout)
#                 if "output" in result:
#                     result["passed"] = (result["output"].strip() == tc.expected.strip())
#                 result["input"] = tc.input
#                 result["expected"] = tc.expected
#                 results.append(result)
#             except Exception as e:
#                 results.append({
#                     "input": tc.input,
#                     "expected": tc.expected,
#                     "error": f"Lỗi/Timeout: {str(e)}"
#                 })

#     elapsed = time.perf_counter() - start_time
#     print(f"[INFO] /execute xử lý {len(request.testcases)} testcases trong {elapsed:.3f}s")

#     return {"results": results}

# # =====================================================
# # Health check
# # =====================================================
# @app.get("/health")
# async def health_check():
#     return {"status": "healthy"}

# # =====================================================
# # 5. Chạy uvicorn server
# # =====================================================
# if __name__ == "__main__":
#     import uvicorn
#     multiprocessing.freeze_support()
#     uvicorn.run(app, host="0.0.0.0", port=8001)


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

# Cho phép CORS
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

# ✅ Model mới cho IDE / run_code_simple
class SimpleCodeRequest(BaseModel):
    code: str
    input: str = ""

# =====================================================
# 3. Hàm chạy code trong process
# =====================================================
# def run_code(code: str, input_data: str):
#     """
#     Hàm chạy trong process riêng, trả về output hoặc error
#     """
#     old_stdout = sys.stdout
#     old_stdin = sys.stdin
#     sys.stdout = buffer = io.StringIO()

#     try:
#         sys.stdin = io.StringIO(input_data)
#         exec(code, {})
#         output = buffer.getvalue()
#         return {"output": output}
#     except Exception:
#         error = traceback.format_exc()
#         return {"error": error}
#     finally:
#         sys.stdout = old_stdout
#         sys.stdin = old_stdin

def run_code(code: str, input_data: str):
    """
    Chạy code trong process riêng, giả lập console:
    - Redirect stdin từ input_data
    - Ghi toàn bộ stdout vào buffer
    - Override builtins.input để in cả prompt + value
    """
    old_stdout = sys.stdout
    old_stdin = sys.stdin
    old_input = builtins.input  # ✅ lưu input gốc

    sys.stdout = buffer = io.StringIO()
    sys.stdin = io.StringIO(input_data)

    def fake_input(prompt: str = "") -> str:
        """
        Giả lập behavior console:
        - In prompt + value + xuống dòng, ví dụ:
          Giá tiền 1 thiệp: 2000
        """
        # Đọc 1 dòng từ stdin (đã được truyền sẵn)
        line = sys.stdin.readline()
        if line == "":  # hết input
            raise EOFError("Hết dữ liệu input")

        value = line.rstrip("\n")
        # In ra prompt + value giống console
        # (nếu prompt không có khoảng trắng cuối, bạn có thể tự thêm trong đề)
        print(f"{prompt}{value}")
        return value

    # Gán input giả
    builtins.input = fake_input

    try:
        exec(code, {})
        output = buffer.getvalue()
        return {"output": output}
    except Exception:
        error = traceback.format_exc()
        return {"error": error}
    finally:
        # Khôi phục lại trạng thái ban đầu
        sys.stdout = old_stdout
        sys.stdin = old_stdin
        builtins.input = old_input


# =====================================================
# 4. API chính: /execute (chấm điểm)
# =====================================================
@app.post("/execute")
def execute_code(request: CodeRequest):
    start_time = time.perf_counter()

    results = []
    num_workers = multiprocessing.cpu_count()  # số core khả dụng trên VPS/máy
    timeout = 5  # timeout mỗi test case

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        future_to_tc = {
            executor.submit(run_code, request.code, tc.input): tc for tc in request.testcases
        }

        for future in as_completed(future_to_tc, timeout=timeout * len(request.testcases)):
            tc = future_to_tc[future]
            try:
                result = future.result(timeout=timeout)
                if "output" in result:
                    result["passed"] = (result["output"].strip() == tc.expected.strip())
                result["input"] = tc.input
                result["expected"] = tc.expected
                results.append(result)
            except Exception as e:
                results.append({
                    "input": tc.input,
                    "expected": tc.expected,
                    "error": f"Lỗi/Timeout: {str(e)}"
                })

    elapsed = time.perf_counter() - start_time
    print(f"[INFO] /execute xử lý {len(request.testcases)} testcases trong {elapsed:.3f}s")

    return {"results": results}

# =====================================================
# 5. API mới: /run_code_simple (IDE chạy code + input)
# =====================================================
@app.post("/run_code_simple")
def run_code_simple(request: SimpleCodeRequest):
    """
    API đơn giản cho IDE — chỉ chạy code + input, không có expected
    """
    try:
        num_workers = 1
        timeout = 5

        with ProcessPoolExecutor(max_workers=num_workers) as executor:
            future = executor.submit(run_code, request.code, request.input)
            result = future.result(timeout=timeout)

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
# 6. Chạy uvicorn server
# =====================================================
if __name__ == "__main__":
    import uvicorn
    multiprocessing.freeze_support()
    uvicorn.run(app, host="0.0.0.0", port=8001)
