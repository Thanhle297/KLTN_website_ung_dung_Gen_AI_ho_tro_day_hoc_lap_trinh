# =====================================================
# Cấu hình runtime (tùy chỉnh bằng ENV nếu cần)
# =====================================================
import os

# Linux-only (giới hạn CPU/RAM trong process con)
try:
    import resource  # type: ignore
    HAS_RESOURCE = True
except Exception:
    HAS_RESOURCE = False

# VPS 8GB / 4 CPU: khuyến nghị 8 sandbox đồng thời
MAX_CONCURRENT_SANDBOX = int(os.getenv("MAX_CONCURRENT_SANDBOX", "30"))
# Giới hạn số sandbox chạy đồng thời trong 1 request (tránh 1 request chiếm hết slot)
# Ví dụ: 15 TC nhưng chỉ chạy 2 TC song song → công bằng hơn khi nhiều học sinh nộp cùng lúc
MAX_CONCURRENT_PER_REQUEST = int(os.getenv("MAX_CONCURRENT_PER_REQUEST", "3"))

# Giới hạn mặc định cho mỗi lần chạy (có thể override theo endpoint nếu muốn)
DEFAULT_TIMEOUT_SEC = int(os.getenv("DEFAULT_TIMEOUT_SEC", "15"))
DEFAULT_CPU_SECONDS = int(os.getenv("DEFAULT_CPU_SECONDS", "15"))
DEFAULT_MEM_MB = int(os.getenv("DEFAULT_MEM_MB", "128"))

MAX_INPUT_CALLS_DEFAULT = int(os.getenv("MAX_INPUT_CALLS_DEFAULT", "200"))
MAX_OUTPUT_CHARS_DEFAULT = int(os.getenv("MAX_OUTPUT_CHARS_DEFAULT", "200000"))

# Option: giới hạn số request đang chờ (tránh queue vô hạn khi cả trường bấm cùng lúc)
# Nếu vượt -> trả 429 nhanh. 0 = tắt giới hạn.
MAX_WAITING_REQUESTS = int(os.getenv("MAX_WAITING_REQUESTS", "0"))
