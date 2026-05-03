// =============================================================================
// adminMenuConfig.js
// Cấu hình menu admin tập trung. Dùng chung cho:
//   - AdminSidebar (render nền nav)
//   - AdminBreadcrumbs (lấy tên trang theo route)
//   - AdminHome (quick actions)
// -----------------------------------------------------------------------------
// Mỗi nhóm có một subheader. Trên breakpoint nhỏ, subheader vẫn xuất hiện
// nhưng trên chế độ collapsed sẽ ẩn (để tiết kiệm không gian).
// =============================================================================

import People from "@mui/icons-material/People";
import School from "@mui/icons-material/School";
import Book from "@mui/icons-material/Book";
import Topic from "@mui/icons-material/Topic";
import Quiz from "@mui/icons-material/Quiz";
import AssignmentInd from "@mui/icons-material/AssignmentInd";
import Inventory2 from "@mui/icons-material/Inventory2";
import History from "@mui/icons-material/History";
import Dashboard from "@mui/icons-material/Dashboard";

/**
 * @typedef {{ label: string, path: string, Icon: React.ComponentType, exactRoot?: boolean }} MenuItem
 * @typedef {{ id: string, title: string, items: MenuItem[] }} MenuGroup
 */

/** @type {MenuGroup[]} */
export const ADMIN_MENU_GROUPS = [
  {
    id: "overview",
    title: "Tổng quan",
    items: [
      { label: "Dashboard", path: "", Icon: Dashboard, exactRoot: true },
      { label: "Lịch sử đăng nhập", path: "login-tracking", Icon: History },
    ],
  },
  {
    id: "users",
    title: "Người dùng",
    items: [
      { label: "Quản lý User", path: "users", Icon: People },
      { label: "Phân bổ học sinh", path: "enrollments", Icon: AssignmentInd },
    ],
  },
  {
    id: "content",
    title: "Học liệu",
    items: [
      { label: "Khóa học", path: "courses", Icon: School },
      { label: "Bài học", path: "lessons", Icon: Book },
      { label: "Bài học con", path: "sub-lessons", Icon: Topic },
    ],
  },
  {
    id: "questions",
    title: "Câu hỏi",
    items: [
      { label: "Câu hỏi theo bài", path: "questions", Icon: Quiz },
      { label: "Ngân hàng câu hỏi", path: "question-bank", Icon: Inventory2 },
    ],
  },
];

// Flatten để tìm nhanh theo path
export const ADMIN_MENU_FLAT = ADMIN_MENU_GROUPS.flatMap((g) => g.items);

/**
 * Tìm menu item khớp với pathname.
 * - Pathname mẫu: "/admin/users", "/admin/course-report/123"
 */
export function findActiveMenuItem(pathname) {
  if (!pathname) return null;
  // Loại prefix "/admin"
  const sub = pathname.replace(/^\/admin\/?/, "");

  // Trang index (sub rỗng) → Dashboard
  if (sub === "" || sub === "/") {
    return ADMIN_MENU_FLAT.find((m) => m.exactRoot) || null;
  }

  // Tìm theo prefix dài nhất (để "course-report/:id" vẫn match đúng)
  let best = null;
  for (const item of ADMIN_MENU_FLAT) {
    if (item.exactRoot) continue;
    if (sub === item.path || sub.startsWith(item.path + "/")) {
      if (!best || item.path.length > best.path.length) best = item;
    }
  }
  return best;
}
