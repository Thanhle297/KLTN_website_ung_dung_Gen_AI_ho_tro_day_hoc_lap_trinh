// routes/progressRoutes.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

router.get("/sublesson/:userId/:lessonId", async (req, res) => {
  try {
    const db = getDB();
    const { userId, lessonId } = req.params;

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
