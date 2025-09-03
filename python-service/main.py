# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Dict, Any
# import sys
# import io
# import traceback
# import contextlib
# import signal
# import multiprocessing
# from concurrent.futures import ProcessPoolExecutor, TimeoutError
# import asyncio

# app = FastAPI()

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class TestCase(BaseModel):
#     input: List[str]
#     expected: str

# class CodeExecutionRequest(BaseModel):
#     code: str
#     testcases: List[TestCase]
#     timeout: int = 5  # timeout in seconds

# class TestResult(BaseModel):
#     input: str
#     expected: str
#     actual: str
#     pass_test: bool
#     error: str = None

# class CodeExecutionResponse(BaseModel):
#     results: List[TestResult]
#     success: bool
#     error: str = None

# def execute_code_with_input(code: str, input_data: str, timeout: int = 5):
#     """Execute Python code with given input in isolated process"""
#     def run_code():
#         # Redirect stdin and stdout
#         old_stdin = sys.stdin
#         old_stdout = sys.stdout
        
#         sys.stdin = io.StringIO(input_data)
#         sys.stdout = io.StringIO()
        
#         try:
#             # Create isolated namespace
#             namespace = {
#                 '__builtins__': __builtins__,
#                 '__name__': '__main__',
#             }
            
#             # Execute code
#             exec(code, namespace)
            
#             # Get output
#             output = sys.stdout.getvalue()
#             return output.strip(), None
            
#         except Exception as e:
#             error_msg = f"{type(e).__name__}: {str(e)}"
#             return None, error_msg
            
#         finally:
#             # Restore stdin and stdout
#             sys.stdin = old_stdin
#             sys.stdout = old_stdout
    
#     # Run in separate process with timeout
#     with ProcessPoolExecutor(max_workers=1) as executor:
#         future = executor.submit(run_code)
#         try:
#             output, error = future.result(timeout=timeout)
#             return output, error
#         except TimeoutError:
#             return None, f"Code execution timed out after {timeout} seconds"
#         except Exception as e:
#             return None, f"Process error: {str(e)}"

# def normalize_string(s: str) -> str:
#     """Normalize string for comparison"""
#     if s is None:
#         return ""
#     return " ".join(s.strip().split())

# @app.post("/execute", response_model=CodeExecutionResponse)
# async def execute_code(request: CodeExecutionRequest):
#     """Execute Python code with multiple test cases"""
#     try:
#         results = []
        
#         for testcase in request.testcases:
#             # Prepare input
#             input_str = "\n".join(testcase.input)
            
#             # Execute code
#             output, error = execute_code_with_input(
#                 request.code, 
#                 input_str, 
#                 request.timeout
#             )
            
#             if error:
#                 result = TestResult(
#                     input=input_str,
#                     expected=testcase.expected,
#                     actual=f"Error: {error}",
#                     pass_test=False,
#                     error=error
#                 )
#             else:
#                 # Normalize for comparison
#                 normalized_output = normalize_string(output)
#                 normalized_expected = normalize_string(testcase.expected)
                
#                 result = TestResult(
#                     input=input_str,
#                     expected=testcase.expected,
#                     actual=output or "No output",
#                     pass_test=normalized_output == normalized_expected,
#                     error=None
#                 )
            
#             results.append(result)
        
#         return CodeExecutionResponse(
#             results=results,
#             success=True,
#             error=None
#         )
        
#     except Exception as e:
#         return CodeExecutionResponse(
#             results=[],
#             success=False,
#             error=str(e)
#         )

# @app.get("/health")
# async def health_check():
#     a = 10
#     """Health check endpoint"""
#     return {"status": "healthy", "service": "python-executor","a":a}

# if __name__ == "__main__":

#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)


# main.py
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Optional
# import sys
# import io
# import traceback
# import asyncio
# import signal
# from contextlib import redirect_stdout, redirect_stderr
# import multiprocessing
# from concurrent.futures import ProcessPoolExecutor, TimeoutError

# app = FastAPI()

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class TestCase(BaseModel):
#     input: str
#     expected: str

# class ExecuteRequest(BaseModel):
#     code: str
#     testcases: List[TestCase]

# class ExecutionResult(BaseModel):
#     output: str
#     error: Optional[str] = None
#     success: bool

# class ExecuteResponse(BaseModel):
#     success: bool
#     results: List[ExecutionResult]

# def execute_code_isolated(code: str, input_data: str, timeout: int = 5):
#     """Execute code in isolated environment with timeout"""
#     def run_code():
#         try:
#             # Create new stdin with input data
#             old_stdin = sys.stdin
#             sys.stdin = io.StringIO(input_data)
            
#             # Capture stdout
#             output_buffer = io.StringIO()
#             old_stdout = sys.stdout
#             sys.stdout = output_buffer
            
#             # Create safe namespace
#             safe_globals = {
#                 '__builtins__': __builtins__,
#                 '__name__': '__main__',
#             }
            
#             # Execute code
#             exec(code, safe_globals)
            
#             # Restore stdin/stdout
#             sys.stdin = old_stdin
#             sys.stdout = old_stdout
            
#             return {
#                 'success': True,
#                 'output': output_buffer.getvalue(),
#                 'error': None
#             }
            
#         except Exception as e:
#             # Restore stdin/stdout in case of error
#             sys.stdin = old_stdin
#             sys.stdout = old_stdout
            
#             return {
#                 'success': False,
#                 'output': '',
#                 'error': str(e)
#             }
    
#     # Use ProcessPoolExecutor for better isolation
#     with ProcessPoolExecutor(max_workers=1) as executor:
#         try:
#             future = executor.submit(run_code)
#             result = future.result(timeout=timeout)
#             return result
#         except TimeoutError:
#             return {
#                 'success': False,
#                 'output': '',
#                 'error': 'Code execution timeout (5 seconds)'
#             }
#         except Exception as e:
#             return {
#                 'success': False,
#                 'output': '',
#                 'error': f'Execution error: {str(e)}'
#             }

# @app.post("/execute", response_model=ExecuteResponse)
# async def execute_code(request: ExecuteRequest):
#     """Execute Python code with multiple test cases"""
    
#     if not request.code.strip():
#         raise HTTPException(status_code=400, detail="Code cannot be empty")
    
#     if not request.testcases:
#         raise HTTPException(status_code=400, detail="At least one test case is required")
    
#     results = []
    
#     # Execute code for each test case
#     for testcase in request.testcases:
#         # Run in thread pool to avoid blocking
#         loop = asyncio.get_event_loop()
#         result = await loop.run_in_executor(
#             None, 
#             execute_code_isolated,
#             request.code,
#             testcase.input
#         )
        
#         results.append(ExecutionResult(
#             output=result['output'].strip() if result['output'] else '',
#             error=result['error'],
#             success=result['success']
#         ))
    
#     return ExecuteResponse(
#         success=True,
#         results=results
#     )

# @app.get("/health")
# async def health_check():
#     """Health check endpoint"""
#     return {"status": "healthy"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)


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
