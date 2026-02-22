const express = require("express");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ============================================
   Middleware: Chỉ admin mới được dùng route này
=============================================== */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
  }
  next();
}

/* ============================================
   POST /api/enrollments/enroll
   Phân bổ 1 user vào 1 course
=============================================== */
router.post("/enroll", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res
        .status(400)
        .json({ message: "userId và courseId là bắt buộc" });
    }

    // Kiểm tra user tồn tại
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    // Chỉ cho phép enroll students, teacher dùng teachingCourses
    if (user.role === "teacher") {
      return res.status(400).json({
        message: "Không thể enroll giáo viên. Hãy dùng chức năng phân công giáo viên",
      });
    }

    // Kiểm tra course tồn tại
    const course = await db.collection("courses").findOne({ courseId });
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Thêm courseId vào enrolledCourses (không trùng lặp)
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $addToSet: { enrolledCourses: courseId },
        $set: { updatedAt: new Date() },
      }
    );

    res.json({ message: "Phân bổ thành công" });
  } catch (error) {
    console.error("❌ Enroll error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   POST /api/enrollments/unenroll
   Gỡ 1 user khỏi 1 course
=============================================== */
router.post("/unenroll", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res
        .status(400)
        .json({ message: "userId và courseId là bắt buộc" });
    }

    // Gỡ courseId khỏi enrolledCourses
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $pull: { enrolledCourses: courseId },
        $set: { updatedAt: new Date() },
      }
    );

    res.json({ message: "Gỡ phân bổ thành công" });
  } catch (error) {
    console.error("❌ Unenroll error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   POST /api/enrollments/bulk-enroll
   Phân bổ nhiều user vào nhiều course
=============================================== */
router.post("/bulk-enroll", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { userIds, courseIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: "userIds phải là mảng không rỗng" });
    }

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res
        .status(400)
        .json({ message: "courseIds phải là mảng không rỗng" });
    }

    // Phân bổ từng user vào tất cả courses
    const updatePromises = userIds.map((userId) =>
      db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $addToSet: { enrolledCourses: { $each: courseIds } },
          $set: { updatedAt: new Date() },
        }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      message: "Phân bổ hàng loạt thành công",
      enrolled: {
        users: userIds.length,
        courses: courseIds.length,
        total: userIds.length * courseIds.length,
      },
    });
  } catch (error) {
    console.error("❌ Bulk enroll error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   GET /api/enrollments/course/:courseId/users
   Lấy danh sách user trong 1 course
=============================================== */
router.get(
  "/course/:courseId/users",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { courseId } = req.params;

      // Lấy tất cả user có courseId trong enrolledCourses
      const users = await db
        .collection("users")
        .find({
          enrolledCourses: courseId,
          role: "user", // Chỉ lấy học sinh, không lấy admin
        })
        .project({ password: 0 }) // Không trả về password
        .sort({ fullname: 1 })
        .toArray();

      res.json(users);
    } catch (error) {
      console.error("❌ Get course users error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

/* ============================================
   GET /api/enrollments/user/:userId/courses
   Lấy danh sách course của 1 user
=============================================== */
router.get(
  "/user/:userId/courses",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { userId } = req.params;

      // Lấy user
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy user" });
      }

      const enrolledCourses = user.role === "teacher"
        ? (user.teachingCourses || [])
        : (user.enrolledCourses || []);

      // Lấy thông tin chi tiết các courses
      const courses = await db
        .collection("courses")
        .find({ courseId: { $in: enrolledCourses } })
        .toArray();

      res.json(courses);
    } catch (error) {
      console.error("❌ Get user courses error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

module.exports = router;
