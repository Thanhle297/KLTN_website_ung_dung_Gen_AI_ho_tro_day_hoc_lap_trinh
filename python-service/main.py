import multiprocessing as mp

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from concurrency import thread_pool
from routers import execute, run_simple, health, ws_run_simple

# =====================================================
# FastAPI app
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
# Mount routers
# =====================================================
app.include_router(execute.router)
app.include_router(run_simple.router)
app.include_router(health.router)
app.include_router(ws_run_simple.router)


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
# Run server
# =====================================================
if __name__ == "__main__":
    import uvicorn
    mp.freeze_support()

    # Khuyến nghị: workers=1 vì service tự spawn sandbox process.
    # Nếu muốn tăng throughput HTTP (không khuyến nghị nếu VPS yếu), có thể tăng 2,
    # nhưng phải giảm MAX_CONCURRENT_SANDBOX tương ứng để tránh quá tải.
    uvicorn.run(app, host="0.0.0.0", port=8001, workers=1)
