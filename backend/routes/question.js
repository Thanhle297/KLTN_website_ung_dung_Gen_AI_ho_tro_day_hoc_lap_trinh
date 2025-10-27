const express = require("express");
const { getDB } = require("../config/mongodb");
const router = express.Router();

// Lấy danh sách khóa học
router.get("/courses", async (req, res) => {
  const data = await getDB().collection("courses").find().toArray();
  res.json(data);
});

// Lấy danh sách bài học theo khóa
router.get("/lessons/:courseId", async (req, res) => {
  try {
    const data = await getDB()
      .collection("lessons")
      .find({ courseId: req.params.courseId })
      .sort({ order: 1 })
      .toArray();

    res.json(data);
  } catch (err) {
    console.error("❌ Lỗi /lessons/:courseId:", err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy chi tiết 1 bài lớn (kèm subLessons)
// router.get("/lesson/:lessonId", async (req, res) => {
//   try {
//     const db = getDB();
//     const lesson = await db
//       .collection("lessons")
//       .findOne({ lessonId: req.params.lessonId });

//     if (!lesson)
//       return res.status(404).json({ error: "Không tìm thấy bài học" });

//     // Thêm số lượng câu hỏi cho mỗi subLesson
//     if (lesson.subLessons && Array.isArray(lesson.subLessons)) {
//       for (const sub of lesson.subLessons) {
//         const count = await db
//           .collection("question")
//           .countDocuments({ lessonId: sub.lessonId });
//         sub.questionCount = count;
//       }
//     }

//     res.json(lesson);
//   } catch (err) {
//     console.error("❌ Lỗi /lesson/:lessonId:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// ✅ Lấy chi tiết bài học hoặc subLesson
router.get("/lesson/:lessonId", async (req, res) => {
  try {
    const db = getDB();
    const { lessonId } = req.params;

    // 1️⃣ Tìm bài học chính
    const lesson = await db.collection("lessons").findOne({ lessonId });

    // Nếu là bài chính -> trả về cùng questionCount của subLessons
    if (lesson) {
      if (lesson.subLessons && Array.isArray(lesson.subLessons)) {
        for (const sub of lesson.subLessons) {
          const count = await db
            .collection("question")
            .countDocuments({ lessonId: sub.lessonId });
          sub.questionCount = count;
        }
      }
      return res.json(lesson);
    }

    // 2️⃣ Nếu không tìm thấy bài chính -> kiểm tra xem có nằm trong subLessons không
    const parentLesson = await db
      .collection("lessons")
      .findOne({ "subLessons.lessonId": lessonId });

    if (!parentLesson)
      return res
        .status(404)
        .json({ error: "Không tìm thấy bài học hoặc subLesson" });

    // Lấy đúng subLesson cần
    const subLesson = parentLesson.subLessons.find(
      (s) => s.lessonId === lessonId
    );

    // Đếm số lượng câu hỏi trong subLesson
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
