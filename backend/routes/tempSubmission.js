// routes/tempSubmission.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const authMiddleware = require("../middleware/authMiddleware");

// Utils
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// Lưu tạm theo từng câu hỏi
// Body: { lessonId, questionId, data: { code, results, guide, status, hasNewGuide } }
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id; // Lấy từ JWT
    const { lessonId, questionId, data } = req.body || {};

    if (!isNonEmptyString(lessonId) || !isNonEmptyString(questionId)) {
      return res.status(400).json({
        success: false,
        message: "Thiếu lessonId hoặc questionId",
      });
    }

    // Normalize data (để tránh lưu bậy)
    const payload = {
      code: typeof data?.code === "string" ? data.code : "",
      results: Array.isArray(data?.results) ? data.results : [],
      guide: typeof data?.guide === "string" ? data.guide : (data?.guide ?? null),
      status:
        data?.status === "correct" || data?.status === "wrong" ? data.status : null,
      hasNewGuide: !!data?.hasNewGuide,
    };

    await db.collection("temp_submissions").updateOne(
      { userId, lessonId, questionId },
      { $set: { userId, lessonId, questionId, data: payload, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.json({ success: true, message: "Đã lưu tạm cho câu hỏi" });
  } catch (err) {
    console.error("❌ Lỗi khi lưu tạm:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Tải lại toàn bộ dữ liệu tạm của bài học
// Query: ?lessonId=
// Response: { [questionId]: { code, results, guide, status, hasNewGuide } }
router.get("/load", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id; // Lấy từ JWT
    const { lessonId } = req.query || {};

    if (!isNonEmptyString(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Thiếu lessonId",
      });
    }

    const docs = await db
      .collection("temp_submissions")
      .find({ userId, lessonId })
      .toArray();

    const result = {};
    for (const d of docs) {
      result[d.questionId] = {
        code: d.data?.code || "",
        results: Array.isArray(d.data?.results) ? d.data.results : [],
        guide: d.data?.guide ?? null,
        status: d.data?.status ?? null,
        hasNewGuide: !!d.data?.hasNewGuide,
      };
    }

    return res.json(result);
  } catch (err) {
    console.error("❌ Lỗi khi tải dữ liệu tạm:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa toàn bộ dữ liệu tạm của bài học
// Body: { lessonId }
router.delete("/clear", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id; // Lấy từ JWT
    const { lessonId } = req.body || {};

    if (!isNonEmptyString(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Thiếu lessonId",
      });
    }

    await db.collection("temp_submissions").deleteMany({ userId, lessonId });
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi xóa dữ liệu tạm:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
