const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  submitAndSaveProgress,
  getHistory,
  getSubmissionDetail,
} = require("../services/submitService");

// POST / - Nộp bài
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ JWT, KHÔNG từ req.body
    const { lessonId, courseId, editorStates } = req.body;

    if (!lessonId || !editorStates) {
      return res.status(400).json({
        success: false,
        message: "Thiếu lessonId / editorStates",
      });
    }

    const result = await submitAndSaveProgress({
      userId,
      lessonId,
      courseId,
      editorStates,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ submit error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /history/:userId/:subLessonId - Lịch sử nộp bài
router.get("/history/:userId/:subLessonId", authMiddleware, async (req, res) => {
  try {
    const { userId, subLessonId } = req.params;

    // Kiểm tra quyền: chỉ chính user đó hoặc admin/teacher mới được xem
    if (req.user.id !== userId && req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ error: "Không có quyền xem lịch sử của người khác" });
    }

    const history = await getHistory(userId, subLessonId);
    res.json(history);
  } catch (err) {
    console.error("❌ History error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /detail/:submissionId - Chi tiết bài nộp
router.get("/detail/:submissionId", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await getSubmissionDetail(submissionId);

    if (!submission) {
      return res.status(404).json({ error: "Không tìm thấy bài nộp" });
    }

    // Kiểm tra quyền: chỉ chính user đó hoặc admin/teacher mới được xem
    if (req.user.id !== submission.userId && req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ error: "Không có quyền xem bài nộp của người khác" });
    }

    res.json(submission);
  } catch (err) {
    console.error("❌ Detail error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
