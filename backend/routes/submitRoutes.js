const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { userId, lessonId, courseId, editorStates } = req.body;

    if (!userId || !lessonId || !editorStates) {
      return res.status(400).json({
        success: false,
        message: "Thiếu userId / lessonId / editorStates",
      });
    }

    // 1️⃣ TÍNH ĐIỂM
    const states = Object.values(editorStates || {});
    const total = states.length;
    const correct = states.filter((s) => s.status === "correct").length;
    const wrong = total - correct;
    const progress = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 2️⃣ LẤY requiredProgress TỪ lessons.subLessons[]
    const lessonDoc = await db
      .collection("lessons")
      .findOne(
        { "subLessons.lessonId": lessonId },
        { projection: { subLessons: 1 } }
      );

    const subLesson = lessonDoc?.subLessons?.find(
      (s) => s.lessonId === lessonId
    );

    const requiredProgress = subLesson?.requiredProgress ?? 70;
    const completed = progress >= requiredProgress;

    // 3️⃣ LƯU LỊCH SỬ (KHÔNG GHI ĐÈ)
    await db.collection("submit_history").insertOne({
      userId,
      lessonId, // chính là subLessonId
      courseId,
      correct,
      wrong,
      total,
      progress,
      requiredProgress,
      editorStates,
      createdAt: new Date(),
    });

    // 4️⃣ LƯU BEST RESULT VÀO sublesson_progress
    const old = await db.collection("sublesson_progress").findOne({
      userId,
      subLessonId: lessonId,
    });

    if (!old || progress > old.progress) {
      await db.collection("sublesson_progress").updateOne(
        { userId, subLessonId: lessonId },
        {
          $set: {
            userId,
            subLessonId: lessonId,
            courseId,
            progress,
            requiredProgress,
            completed,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return res.json({
      success: true,
      correct,
      wrong,
      total,
      progress,
      requiredProgress,
      completed,
      bestProgress: old ? Math.max(progress, old.progress) : progress,
      improved: !old || progress > old.progress,
    });
  } catch (err) {
    console.error("❌ submit error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
