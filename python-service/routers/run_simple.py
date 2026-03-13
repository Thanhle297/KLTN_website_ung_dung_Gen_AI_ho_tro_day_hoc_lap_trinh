# =====================================================
# API IDE: run_code_simple - SONG SONG CÓ KIỂM SOÁT
# =====================================================
from fastapi import APIRouter

from config import (
    DEFAULT_TIMEOUT_SEC,
    DEFAULT_CPU_SECONDS,
    DEFAULT_MEM_MB,
)
from models import SimpleCodeRequest
from concurrency import run_sandbox_limited

router = APIRouter()


@router.post("/run_code_simple")
async def run_code_simple(request: SimpleCodeRequest):
    r = await run_sandbox_limited(
        code=request.code,
        input_data=request.input,
        echo_input=request.echo_input,
        timeout_sec=DEFAULT_TIMEOUT_SEC,
        cpu_seconds=DEFAULT_CPU_SECONDS,
        mem_mb=DEFAULT_MEM_MB,
    )

    if "error" in r:
        return {"success": False, "error": r["error"], "meta": {k: v for k, v in r.items() if k != "error"}}

    return {"success": True, "output": r.get("output") or "(Không có kết quả)"}
