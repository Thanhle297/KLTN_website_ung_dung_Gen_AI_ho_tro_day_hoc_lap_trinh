const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");
const {
  getLessonsByCourse,
  getLesson,
  getLessonDetail,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} = require("../services/lessonService");

/* -------- GET lessons by course -------- */
router.get("/course/:courseId", authMiddleware, async (req, res) => {
  try {
    const list = await getLessonsByCourse(req.params.courseId);
    res.json(list);
  } catch (err) {
    console.error("❌ Get lessons error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------- GET 1 lesson -------- */
router.get("/:lessonId", authMiddleware, async (req, res) => {
  try {
    const doc = await getLesson(req.params.lessonId, req.query.courseId);
    res.json(doc);
  } catch (err) {
    console.error("❌ Get lesson error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------- GET bài lớn hoặc subLesson -------- */
router.get("/detail/:lessonId", authMiddleware, async (req, res) => {
  try {
    const result = await getLessonDetail(req.params.lessonId, req.query.courseId);

    if (!result) {
      return res.status(404).json({ error: "Không tìm thấy bài học" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------- CREATE -------- */
router.post("/", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { lessonNumber } = req.body;

    // Validation lessonNumber
    if (lessonNumber === undefined || lessonNumber === null || lessonNumber === "") {
      return res.status(400).json({
        message: "Thiếu trường lessonNumber (Số bài học SGK)",
      });
    }

    const num = Number(lessonNumber);
    if (isNaN(num) || num < 16 || num > 28) {
      return res.status(400).json({
        message: `lessonNumber không hợp lệ: ${lessonNumber}. Phải là số từ 16-28`,
      });
    }

    const lessonId = await createLesson(req.body);
    res.json({ message: "Lesson created", lessonId });
  } catch (err) {
    console.error("❌ Tạo lesson lỗi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* -------- UPDATE -------- */
router.put("/:lessonId", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const result = await updateLesson(req.params.lessonId, req.body, req.query.courseId);
    res.json({
      message: "Lesson updated",
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------- DELETE -------- */
router.delete("/:lessonId", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const deletedCount = await deleteLesson(req.params.lessonId, req.query.courseId);
    res.json({ message: "Lesson deleted", deletedCount });
  } catch (err) {
    console.error("❌ Delete lesson error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------- REORDER LESSONS -------- */
router.put("/reorder/batch", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { courseId, lessonIds } = req.body;

    if (!courseId || !Array.isArray(lessonIds)) {
      return res.status(400).json({
        message: "Thiếu courseId hoặc lessonIds",
      });
    }

    const count = await reorderLessons(courseId, lessonIds);
    res.json({ message: "Cập nhật thứ tự thành công", count });
  } catch (err) {
    console.error("❌ Reorder lessons error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
