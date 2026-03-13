# =====================================================
# Giới hạn tài nguyên cho process con (Linux)
# =====================================================
from config import HAS_RESOURCE


def apply_limits(cpu_seconds: int, mem_mb: int) -> None:
    """Áp dụng giới hạn tài nguyên trong process con (Linux)."""
    if not HAS_RESOURCE:
        return

    import resource

    # CPU time
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds))

    # Virtual memory (address space)
    mem_bytes = mem_mb * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))

    # No core dump
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
