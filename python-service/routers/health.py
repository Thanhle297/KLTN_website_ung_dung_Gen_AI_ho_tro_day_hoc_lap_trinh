# =====================================================
# Health check
# =====================================================
from fastapi import APIRouter

from config import (
    DEFAULT_TIMEOUT_SEC,
    DEFAULT_CPU_SECONDS,
    DEFAULT_MEM_MB,
    MAX_INPUT_CALLS_DEFAULT,
    MAX_OUTPUT_CHARS_DEFAULT,
    MAX_CONCURRENT_SANDBOX,
)

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "max_concurrent_sandbox": MAX_CONCURRENT_SANDBOX,
        "limits": {
            "timeout_sec": DEFAULT_TIMEOUT_SEC,
            "cpu_seconds": DEFAULT_CPU_SECONDS,
            "mem_mb": DEFAULT_MEM_MB,
            "max_input_calls": MAX_INPUT_CALLS_DEFAULT,
            "max_output_chars": MAX_OUTPUT_CHARS_DEFAULT,
        },
    }
