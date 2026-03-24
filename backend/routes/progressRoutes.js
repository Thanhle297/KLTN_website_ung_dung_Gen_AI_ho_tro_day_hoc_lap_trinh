// routes/progressRoutes.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/sublesson/:userId/:lessonId", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { userId, lessonId } = req.params;

    // Kiểm tra quyền: chỉ chính user đó hoặc admin/teacher mới được xem
    if (req.user.id !== userId && req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ success: false, error: "Không có quyền xem tiến độ của người khác" });
    }

    const doc = await db
      .collection("sublesson_progress")
      .findOne({ userId, subLessonId: lessonId });

    if (!doc) return res.json({ success: true, progress: 0, completed: false });

    res.json({
      success: true,
      progress: doc.progress || 0,
      completed: !!doc.completed,
    });
  } catch (err) {
    console.error("❌ Progress error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
