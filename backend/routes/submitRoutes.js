// routes/submitRoutes.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { userId, lessonId, courseId, editorStates } = req.body;

    const states = Object.values(editorStates || {});
    const total = states.length;
    const correct = states.filter((s) => s.status === "correct").length;
    const wrong = total - correct;
    const progress = total > 0 ? Math.round((correct / total) * 100) : 0;
    const completed = progress >= 70;

    // 1️⃣ LUÔN LƯU LỊCH SỬ
    await db.collection("submit_history").insertOne({
      userId,
      lessonId,
      courseId,
      correct,
      wrong,
      total,
      progress,
      editorStates,
      createdAt: new Date(),
    });

    // 2️⃣ LẤY TIẾN ĐỘ TỐT NHẤT TRƯỚC ĐÓ
    const oldProgress = await db
      .collection("sublesson_progress")
      .findOne({ userId, subLessonId: lessonId });

    // 3️⃣ CHỈ UPDATE NẾU TỐT HƠN
    if (!oldProgress || progress > oldProgress.progress) {
      await db.collection("sublesson_progress").updateOne(
        { userId, subLessonId: lessonId },
        {
          $set: {
            userId,
            subLessonId: lessonId,
            courseId,
            progress,
            completed,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      correct,
      wrong,
      total,
      progress,
      bestProgress: oldProgress
        ? Math.max(progress, oldProgress.progress)
        : progress,
      improved: !oldProgress || progress > oldProgress.progress,
    });
  } catch (err) {
    console.error("❌ submit error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
