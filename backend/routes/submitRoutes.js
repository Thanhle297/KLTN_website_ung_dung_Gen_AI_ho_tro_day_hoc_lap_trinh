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

    // 1️⃣ TÍNH ĐIỂM (hỗ trợ 3 mức: correct=1đ, partial=0.5đ, wrong=0đ)
    const states = Object.values(editorStates || {});
    const total = states.length;
    const correct = states.filter((s) => s.status === "correct").length;
    const partial = states.filter((s) => s.status === "partial").length;
    const wrong = total - correct - partial;
    const progress =
      total > 0
        ? Math.round(((correct * 1 + partial * 0.5) / total) * 100)
        : 0;

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

    // 2.5️⃣ LẤY DANH SÁCH CÂU HỎI HIỆN TẠI (SNAPSHOT)
    const snapshotQuery = { lessonId };
    if (courseId) snapshotQuery.courseId = courseId;
    const questionsSnapshot = await db
      .collection("question")
      .find(snapshotQuery)
      .toArray();

    // 3️⃣ LƯU LỊCH SỬ (KHÔNG GHI ĐÈ)
    const insertResult = await db.collection("submit_history").insertOne({
      userId,
      lessonId, // chính là subLessonId
      courseId,
      correct,
      partial,
      wrong,
      total,
      progress,
      requiredProgress,
      editorStates,
      questions: questionsSnapshot, // ✅ Lưu snapshot câu hỏi
      createdAt: new Date(),
    });

    const submissionId = insertResult.insertedId.toString();

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
      partial,
      wrong,
      total,
      progress,
      requiredProgress,
      completed,
      submissionId,
      bestProgress: old ? Math.max(progress, old.progress) : progress,
      improved: !old || progress > old.progress,
    });
  } catch (err) {
    console.error("❌ submit error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ GET HISTORY
router.get("/history/:userId/:subLessonId", async (req, res) => {
  try {
    const db = getDB();
    const { userId, subLessonId } = req.params;

    const history = await db
      .collection("submit_history")
      .find(
        { userId, lessonId: subLessonId }, // lessonId trong DB chính là subLessonId
        {
          projection: {
            _id: 1,
            createdAt: 1,
            progress: 1,
            correct: 1,
            total: 1,
            requiredProgress: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    res.json(history);
  } catch (err) {
    console.error("❌ History error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET DETAIL
router.get("/detail/:submissionId", async (req, res) => {
  try {
    const db = getDB();
    const { ObjectId } = require("mongodb");
    const { submissionId } = req.params;

    const submission = await db
      .collection("submit_history")
      .findOne({ _id: new ObjectId(submissionId) });

    if (!submission) {
      return res.status(404).json({ error: "Không tìm thấy bài nộp" });
    }

    res.json(submission);
  } catch (err) {
    console.error("❌ Detail error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
