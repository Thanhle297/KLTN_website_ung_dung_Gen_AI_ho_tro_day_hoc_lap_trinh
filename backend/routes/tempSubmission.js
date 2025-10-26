// routes/tempSubmission.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

// ✅ Lưu tạm theo từng câu hỏi
router.post("/save", async (req, res) => {
  try {
    const db = getDB();
    const { userId, lessonId, questionId, data } = req.body;
    if (!userId || !lessonId || !questionId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu userId, lessonId hoặc questionId" });

    await db.collection("temp_submissions").updateOne(
      { userId, lessonId, questionId },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true, message: "Đã lưu tạm cho câu hỏi" });
  } catch (err) {
    console.error("❌ Lỗi khi lưu tạm:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Tải lại toàn bộ dữ liệu tạm của bài học
router.get("/load", async (req, res) => {
  try {
    const db = getDB();
    const { userId, lessonId } = req.query;
    if (!userId || !lessonId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu userId hoặc lessonId" });

    const docs = await db
      .collection("temp_submissions")
      .find({ userId, lessonId })
      .toArray();

    const result = docs.map((d) => ({
      questionId: d.questionId,
      code: d.data?.code || "",
      results: d.data?.results || [],
      guide: d.data?.guide || null,
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ Lỗi khi tải dữ liệu tạm:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Xóa toàn bộ dữ liệu tạm của bài học
router.delete("/clear", async (req, res) => {
  try {
    const db = getDB();
    const { userId, lessonId } = req.body;
    await db.collection("temp_submissions").deleteMany({ userId, lessonId });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi xóa dữ liệu tạm:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
