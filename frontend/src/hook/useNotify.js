// =============================================================================
// useNotify.js - Hook notification chung cho toàn admin
// -----------------------------------------------------------------------------
// Mục đích:
//   - Thay thế hàng chục helper `notify()` / `showMessage()` rải rác ở các page
//     CRUD (UsersCRUD, CoursesCRUD, LessonsCRUD, ...).
//   - Đảm bảo UX nhất quán: cùng vị trí toast, cùng duration, cùng cách phân
//     biệt severity.
//
// Cách dùng:
//   import useNotify from "../../hook/useNotify";
//   const notify = useNotify();
//   notify("Lưu thành công!");                    // success (default)
//   notify("Có lỗi khi lưu", "error");
//   notify("Vui lòng chọn ít nhất một mục", "warning");
//   notify("Đang đồng bộ...", "info");
//   notify.success("OK");                         // alias ngắn
//   notify.error("Sai rồi");
//   notify.warning("Cẩn thận");
//   notify.info("FYI");
//   const id = notify.loading("Đang xử lý...");   // toast persistent
//   notify.dismiss(id);                           // tắt khi xong
//
// Lưu ý:
//   - 100% wrap quanh `sonner`, KHÔNG dùng MUI Snackbar nữa.
//   - Tin nhắn LUÔN bằng tiếng Việt theo guideline AGENTS.md.
// =============================================================================

import { useMemo } from "react";
import { toast } from "sonner";

const DEFAULT_DURATION = 3500;

function showByLevel(message, level = "success", options = {}) {
  const opts = { duration: DEFAULT_DURATION, ...options };
  switch (level) {
    case "error":
      return toast.error(message, opts);
    case "warning":
      return toast.warning(message, opts);
    case "info":
      return toast.info(message, opts);
    case "loading":
      return toast.loading(message, { duration: Infinity, ...options });
    case "success":
    default:
      return toast.success(message, opts);
  }
}

export default function useNotify() {
  // useMemo để giữ reference ổn định (an toàn cho useEffect deps)
  return useMemo(() => {
    const fn = (message, level = "success", options) =>
      showByLevel(message, level, options);

    fn.success = (msg, options) => showByLevel(msg, "success", options);
    fn.error = (msg, options) => showByLevel(msg, "error", options);
    fn.warning = (msg, options) => showByLevel(msg, "warning", options);
    fn.info = (msg, options) => showByLevel(msg, "info", options);
    fn.loading = (msg, options) => showByLevel(msg, "loading", options);
    fn.dismiss = (id) => toast.dismiss(id);

    /**
     * Hiển thị toast theo trạng thái Promise (loading -> success/error tự động).
     * @example
     *   await notify.promise(api.save(...), {
     *     loading: "Đang lưu...",
     *     success: "Đã lưu thành công",
     *     error: (err) => `Lỗi: ${err?.message || "Không xác định"}`,
     *   });
     */
    fn.promise = (promise, messages) => toast.promise(promise, messages);

    return fn;
  }, []);
}
