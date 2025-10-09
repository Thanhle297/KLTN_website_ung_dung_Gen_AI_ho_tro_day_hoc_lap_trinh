const express = require("express");
const { getDB } = require("../config/mongodb");

const router = express.Router();

// Lấy tất cả câu hỏi
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const questions = await db.collection("question").find().toArray();
    res.json(questions);
  } catch (err) {
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
