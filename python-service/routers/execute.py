# =====================================================
# API execute (chấm testcases) - HYBRID CONCURRENCY
# - Mỗi request chỉ chiếm tối đa MAX_CONCURRENT_PER_REQUEST slot
# - Nhiều request từ nhiều học sinh: cùng chia sẻ global semaphore → công bằng
# =====================================================
import asyncio
import time
from typing import List, Dict, Any

from fastapi import APIRouter

from config import (
    DEFAULT_TIMEOUT_SEC,
    DEFAULT_CPU_SECONDS,
    DEFAULT_MEM_MB,
    MAX_CONCURRENT_SANDBOX,
    MAX_CONCURRENT_PER_REQUEST,
)
from models import CodeRequest
from concurrency import run_sandbox_limited

router = APIRouter()


@router.post("/execute")
async def execute_code(request: CodeRequest):
    start_time = time.perf_counter()

    PER_TEST_TIMEOUT = DEFAULT_TIMEOUT_SEC
    CPU_SECONDS = DEFAULT_CPU_SECONDS
    MEM_MB = DEFAULT_MEM_MB

    # Semaphore cục bộ cho request này: giới hạn số TC chạy song song trong 1 request
    # → tránh 1 request (15 TC) chiếm hết global slot, học sinh khác phải chờ
    per_request_sem = asyncio.Semaphore(MAX_CONCURRENT_PER_REQUEST)

    async def run_one_tc(tc):
        async with per_request_sem:
            return await run_sandbox_limited(
                code=request.code,
                input_data=tc.input,
                echo_input=request.echo_input,
                timeout_sec=PER_TEST_TIMEOUT,
                cpu_seconds=CPU_SECONDS,
                mem_mb=MEM_MB,
            )

    raw_results = await asyncio.gather(
        *(run_one_tc(tc) for tc in request.testcases)
    )

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
        f"MAX_CONCURRENT_SANDBOX={MAX_CONCURRENT_SANDBOX} | "
        f"PER_REQUEST={MAX_CONCURRENT_PER_REQUEST}"
    )

    return {
        "results": results,
        "meta": {
            "count": len(results),
            "elapsed_sec": round(elapsed, 3),
            "max_concurrent_sandbox": MAX_CONCURRENT_SANDBOX,
            "max_concurrent_per_request": MAX_CONCURRENT_PER_REQUEST,
        },
    }
