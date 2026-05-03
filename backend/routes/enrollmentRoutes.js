const express = require("express");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/coursePermission");
const {
  enrollUser,
  unenrollUser,
  bulkEnroll,
  getCourseUsers,
  getUserCourses,
} = require("../services/enrollmentService");
const { getDB } = require("../config/mongodb");

const router = express.Router();

/* ============================================
   POST /api/enrollments/enroll
   Phân bổ 1 user vào 1 course
=============================================== */
router.post("/enroll", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res
        .status(400)
        .json({ message: "userId và courseId là bắt buộc" });
    }

    const result = await enrollUser(userId, courseId);

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    res.json({ message: result.message });
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
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res
        .status(400)
        .json({ message: "userId và courseId là bắt buộc" });
    }

    await unenrollUser(userId, courseId);
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

    const enrolled = await bulkEnroll(userIds, courseIds);

    res.json({
      message: "Phân bổ hàng loạt thành công",
      enrolled,
    });
  } catch (error) {
    console.error("❌ Bulk enroll error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   POST /api/enrollments/bulk
   Bulk add/remove enrollments
=============================================== */
router.post("/bulk", authMiddleware, async (req, res) => {
  try {
    const { add = [], remove = [] } = req.body;
    const db = getDB();
    let addCount = 0, removeCount = 0;

    // Process additions
    for (const item of add) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(item.userId) },
        { $addToSet: { enrolledCourses: item.courseId } }
      );
      addCount++;
    }

    // Process removals
    for (const item of remove) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(item.userId) },
        { $pull: { enrolledCourses: item.courseId } }
      );
      removeCount++;
    }

    res.json({ 
      message: `Đã thêm ${addCount}, gỡ ${removeCount} phân bổ`,
      addCount,
      removeCount 
    });
  } catch (err) {
    console.error("❌ Bulk enrollment error:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ============================================
   GET /api/enrollments/course/:courseId/users
=============================================== */
router.get(
  "/course/:courseId/users",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const users = await getCourseUsers(req.params.courseId);
      res.json(users);
    } catch (error) {
      console.error("❌ Get course users error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

/* ============================================
   GET /api/enrollments/user/:userId/courses
=============================================== */
router.get(
  "/user/:userId/courses",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { user, courses } = await getUserCourses(req.params.userId);

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy user" });
      }

      res.json(courses);
    } catch (error) {
      console.error("❌ Get user courses error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

module.exports = router;
