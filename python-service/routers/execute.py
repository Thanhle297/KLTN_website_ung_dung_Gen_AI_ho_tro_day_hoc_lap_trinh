# =====================================================
# API execute (chấm testcases) - SONG SONG CÓ KIỂM SOÁT
# - Trong 1 request: các testcases chạy đồng thời nhưng vẫn bị giới hạn bởi semaphore
# - Nhiều request từ nhiều học sinh: cùng chia sẻ semaphore -> hệ thống ổn định
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
)
from models import CodeRequest
from concurrency import run_sandbox_limited

router = APIRouter()


@router.post("/execute")
async def execute_code(request: CodeRequest):
    start_time = time.perf_counter()

    # Tham số an toàn (tùy bạn chỉnh/đưa ENV)
    PER_TEST_TIMEOUT = DEFAULT_TIMEOUT_SEC
    CPU_SECONDS = DEFAULT_CPU_SECONDS
    MEM_MB = DEFAULT_MEM_MB

    tasks = [
        run_sandbox_limited(
            code=request.code,
            input_data=tc.input,
            echo_input=request.echo_input,
            timeout_sec=PER_TEST_TIMEOUT,
            cpu_seconds=CPU_SECONDS,
            mem_mb=MEM_MB,
        )
        for tc in request.testcases
    ]

    raw_results = await asyncio.gather(*tasks)

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
        f"MAX_CONCURRENT_SANDBOX={MAX_CONCURRENT_SANDBOX}"
    )

    return {
        "results": results,
        "meta": {
            "count": len(results),
            "elapsed_sec": round(elapsed, 3),
            "max_concurrent_sandbox": MAX_CONCURRENT_SANDBOX,
        },
    }
