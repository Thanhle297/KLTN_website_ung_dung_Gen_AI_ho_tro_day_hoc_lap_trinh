// routes/question.js
const express = require("express");
const { getDB } = require("../config/mongodb");
const router = express.Router();

/* ------------------- KHÓA HỌC ------------------- */
// Lấy danh sách khóa học
router.get("/courses", async (req, res) => {
  try {
    const data = await getDB().collection("courses").find().toArray();
    res.json(data);
  } catch (err) {
    console.error("❌ Lỗi /courses:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------- BÀI HỌC ------------------- */
// Lấy danh sách bài học theo khóa (chỉ hiện display=true hoặc không có trường display)
router.get("/lessons/:courseId", async (req, res) => {
  try {
    const data = await getDB()
      .collection("lessons")
      .find({
        courseId: req.params.courseId,
        $or: [{ display: { $exists: false } }, { display: true }],
      })
      .sort({ order: 1 })
      .toArray();

    res.json(data);
  } catch (err) {
    console.error("❌ Lỗi /lessons/:courseId:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------- CHI TIẾT BÀI HỌC ------------------- */
router.get("/lesson/:lessonId", async (req, res) => {
  try {
    const db = getDB();
    const { lessonId } = req.params;

    // 1️⃣ Tìm bài học chính có display=true hoặc chưa có field display
    const lesson = await db.collection("lessons").findOne({
      lessonId,
      $or: [{ display: { $exists: false } }, { display: true }],
    });

    if (lesson) {
      // Thêm số lượng câu hỏi cho từng subLesson (chỉ lấy subLesson display=true)
      if (lesson.subLessons && Array.isArray(lesson.subLessons)) {
        const visibleSubs = lesson.subLessons.filter(
          (s) => s.display !== false
        );

        for (const sub of visibleSubs) {
          const count = await db
            .collection("question")
            .countDocuments({ lessonId: sub.lessonId });
          sub.questionCount = count;
        }

        lesson.subLessons = visibleSubs;
      }
      return res.json(lesson);
    }

    // 2️⃣ Nếu không tìm thấy bài chính, kiểm tra subLesson
    const parentLesson = await db.collection("lessons").findOne({
      "subLessons.lessonId": lessonId,
      $or: [{ display: { $exists: false } }, { display: true }],
    });

    if (!parentLesson)
      return res
        .status(404)
        .json({ error: "Không tìm thấy bài học hoặc subLesson" });

    // Tìm subLesson và kiểm tra display
    const subLesson = parentLesson.subLessons.find(
      (s) => s.lessonId === lessonId && s.display !== false
    );

    if (!subLesson)
      return res.status(403).json({ error: "SubLesson bị ẩn (display=false)" });

    const questionCount = await db
      .collection("question")
      .countDocuments({ lessonId });

    subLesson.questionCount = questionCount;
    subLesson.parentLesson = {
      lessonId: parentLesson.lessonId,
      title: parentLesson.title,
    };

    return res.json(subLesson);
  } catch (err) {
    console.error("❌ Lỗi /lesson/:lessonId:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------- CÂU HỎI ------------------- */
// Lấy câu hỏi theo bài học
router.get("/question", async (req, res) => {
  try {
    const { lessonId } = req.query;
    const query = lessonId ? { lessonId } : {};
    const items = await getDB()
      .collection("question")
      .find(query)
      .sort({ order: 1, id: 1 })
      .toArray();

    res.json(items);
  } catch (err) {
    console.error("❌ Lỗi /question:", err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy câu hỏi theo ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const question = await db
      .collection("question")
      .findOne({ id: parseInt(req.params.id) });

    if (!question)
      return res.status(404).json({ error: "Không tìm thấy câu hỏi" });

    res.json(question);
  } catch (err) {
    console.error("❌ Lỗi /:id:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
