const express = require("express");
const { getDB } = require("../config/mongodb");

const router = express.Router();

// lấy khóa học
router.get("/courses", async (req, res) => {
  const data = await getDB().collection("courses").find().toArray();
  res.json(data);
});

// lấy câu hỏi lesson
router.get("/lessons/:courseId", async (req, res) => {
  const data = await getDB()
    .collection("lessons")
    .find({ courseId: req.params.courseId })
    .toArray();
  res.json(data);
});

// Lấy tất cả câu hỏi
router.get("/question", async (req, res) => {
  try {
    const { lessonId } = req.query;
    const q = lessonId ? { lessonId } : {};
    const items = await getDB()
      .collection("question")
      .find(q)
      .sort({ order: 1, id: 1, _id: 1 }) // ưu tiên order, rồi id
      .toArray();
    res.json(items);
  } catch (err) {
    console.error("❌ Lỗi /questions:", err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy câu hỏi theo id
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const question = await db
      .collection("question")
      .findOne({ id: parseInt(req.params.id) });

    if (!question) {
      return res.status(404).json({ error: "Không tìm thấy câu hỏi" });
    }

    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
