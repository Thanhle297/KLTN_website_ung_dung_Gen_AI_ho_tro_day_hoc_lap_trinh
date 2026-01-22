// middleware/teacherOrAdminMiddleware.js
// Middleware kiểm tra quyền truy cập cho teacher hoặc admin

/**
 * Middleware cho phép teacher hoặc admin truy cập
 * Sử dụng sau authMiddleware để đảm bảo req.user đã được gắn
 */
function teacherOrAdminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Chưa xác thực người dùng" });
  }

  const allowedRoles = ["admin", "teacher"];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Chỉ admin hoặc giáo viên mới có quyền truy cập",
    });
  }

  next();
}

module.exports = teacherOrAdminMiddleware;
