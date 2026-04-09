// routes/progressRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getSubLessonProgress } = require("../services/progressService");

router.get("/sublesson/:userId/:lessonId", authMiddleware, async (req, res) => {
  try {
    const { userId, lessonId } = req.params;

    // Kiểm tra quyền: chỉ chính user đó hoặc admin/teacher mới được xem
    if (req.user.id !== userId && req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ success: false, error: "Không có quyền xem tiến độ của người khác" });
    }

    const progress = await getSubLessonProgress(userId, lessonId);
    res.json({ success: true, ...progress });
  } catch (err) {
    console.error("❌ Progress error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
