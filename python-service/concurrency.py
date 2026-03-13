# =====================================================
# Concurrency control (đúng luồng nghiệp vụ)
# - Semaphore: giới hạn số sandbox chạy đồng thời
# - ThreadPoolExecutor: offload safe_run (blocking) khỏi event loop
# - Waiting counter: chặn nhanh nếu queue quá dài
# =====================================================
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any

from config import (
    MAX_CONCURRENT_SANDBOX,
    DEFAULT_TIMEOUT_SEC,
    DEFAULT_CPU_SECONDS,
    DEFAULT_MEM_MB,
    MAX_INPUT_CALLS_DEFAULT,
    MAX_OUTPUT_CHARS_DEFAULT,
    MAX_WAITING_REQUESTS,
)
from sandbox.runner import safe_run


# Global concurrency primitives
thread_pool = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_SANDBOX)
sandbox_semaphore = asyncio.Semaphore(MAX_CONCURRENT_SANDBOX)

# Đếm số request đang chờ (OPTIONAL)
_waiting_lock = asyncio.Lock()
_waiting_requests = 0


async def inc_waiting() -> None:
    global _waiting_requests
    async with _waiting_lock:
        _waiting_requests += 1


async def dec_waiting() -> None:
    global _waiting_requests
    async with _waiting_lock:
        _waiting_requests = max(0, _waiting_requests - 1)


async def get_waiting() -> int:
    async with _waiting_lock:
        return _waiting_requests


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
        waiting = await get_waiting()
        # waiting ở đây chỉ là counter tương đối, mục tiêu: tránh overrun khi đột biến
        if waiting >= MAX_WAITING_REQUESTS:
            return {
                "error": "Hệ thống đang quá tải. Vui lòng thử lại sau ít giây.",
                "overloaded": True,
            }

    await inc_waiting()
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
        await dec_waiting()
