// middleware/coursePermission.js
// Middleware kiểm tra quyền truy cập theo khóa học
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

/**
 * requireCourseAccess - Cho phép admin hoặc teacher của khóa
 * Phải dùng sau authMiddleware (cần req.user)
 *
 * Lấy courseId từ: body.courseId | body.targetCourseId | query.courseId | params.courseId
 * - Admin: luôn pass
 * - courseId = null/global: chỉ admin
 * - Teacher: kiểm tra courseId có trong teachingCourses
 */
function requireCourseAccess(req, res, next) {
  const { role, id } = req.user;

  // Admin luôn pass
  if (role === "admin") return next();

  // Lấy courseId từ nhiều nguồn
  const courseId =
    req.body.courseId ||
    req.body.targetCourseId ||
    req.query.courseId ||
    req.params.courseId;

  // Nếu courseId = null (global) -> chỉ admin
  if (!courseId || courseId === "null") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền này" });
  }

  // Teacher: kiểm tra courseId có trong teachingCourses
  if (role === "teacher") {
    const db = getDB();
    db.collection("users")
      .findOne({ _id: new ObjectId(id) }, { projection: { teachingCourses: 1 } })
      .then((user) => {
        if (!user) {
          return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        const teachingCourses = (user.teachingCourses || []).map(id => id.toString());
        if (teachingCourses.includes(courseId.toString())) {
          return next();
        }
        return res
          .status(403)
          .json({ message: "Bạn không có quyền trên khóa học này" });
      })
      .catch((err) => {
        console.error("❌ Lỗi kiểm tra quyền khóa học:", err);
        return res.status(500).json({ message: "Lỗi server" });
      });
    return;
  }

  // Các role khác -> 403
  return res
    .status(403)
    .json({ message: "Không có quyền thực hiện thao tác này" });
}

/**
 * requireAdmin - Chỉ cho phép admin
 */
function requireAdmin(req, res, next) {
  if (req.user.role === "admin") return next();
  return res.status(403).json({ message: "Chỉ admin mới có quyền này" });
}

module.exports = { requireCourseAccess, requireAdmin };
