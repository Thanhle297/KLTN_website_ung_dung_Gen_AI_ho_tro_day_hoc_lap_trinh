const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");
const { requireCourseAccess, requireAdmin } = require("../middleware/coursePermission");
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  assignQuestions,
  importToCourse,
  copyBetweenCourses,
  promoteToGlobal,
} = require("../services/questionService");

/* ------------ GET All / by lessonId or isBank ------------ */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const list = await getQuestions(req.query);
    res.json(list);
  } catch (err) {
    console.error("❌ Lỗi lấy câu hỏi:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ ASSIGN (Clone from Bank) ------------ */
router.post("/assign", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { questionIds, targetLessonId, courseId } = req.body;

    const result = await assignQuestions(questionIds, targetLessonId, courseId);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: result.count > 0
        ? `Assigned ${result.count} questions`
        : "No questions found",
      count: result.count,
    });
  } catch (err) {
    console.error("❌ Assign questions error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ GET one ------------ */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await getQuestionById(req.params.id);
    res.json(doc);
  } catch (err) {
    console.error("❌ Get question error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ CREATE ------------ */
router.post("/", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const newId = await createQuestion(req.body);
    res.json({ message: "Question created", id: newId });
  } catch (err) {
    console.error("❌ Create question error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ UPDATE ------------ */
router.put("/:id", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const matched = await updateQuestion(req.params.id, req.body);
    res.json({ message: "Question updated", matched });
  } catch (err) {
    console.error("❌ Update question error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ DELETE ------------ */
router.delete("/:id", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    await deleteQuestion(req.params.id);
    res.json({ message: "Question deleted" });
  } catch (err) {
    console.error("❌ Delete question error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ REORDER QUESTIONS ------------ */
router.put("/reorder/batch", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ message: "Thiếu questionIds" });
    }

    const count = await reorderQuestions(questionIds);
    res.json({ message: "Cập nhật thứ tự câu hỏi thành công", count });
  } catch (err) {
    console.error("❌ Reorder questions error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ IMPORT: Global Bank → Course Bank ------------ */
router.post("/import-to-course", authMiddleware, requireCourseAccess, async (req, res) => {
  try {
    const { questionIds, targetCourseId } = req.body;

    if (!questionIds || !questionIds.length) {
      return res.status(400).json({ message: "Thiếu danh sách câu hỏi" });
    }
    if (!targetCourseId) {
      return res.status(400).json({ message: "Thiếu khóa học đích" });
    }

    const result = await importToCourse(questionIds, targetCourseId);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({ message: "Import thành công", ...result });
  } catch (err) {
    console.error("❌ Import to course error:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ COPY: Course Bank A → Course Bank B ------------ */
router.post("/copy-between-courses", authMiddleware, requireCourseAccess, async (req, res) => {
  try {
    const { questionIds, sourceCourseId, targetCourseId, copyCategories } = req.body;

    if (!questionIds || !questionIds.length) {
      return res.status(400).json({ message: "Thiếu danh sách câu hỏi" });
    }
    if (sourceCourseId === targetCourseId) {
      return res.status(400).json({ message: "Khóa nguồn và khóa đích không được trùng nhau" });
    }

    const result = await copyBetweenCourses({
      questionIds,
      sourceCourseId,
      targetCourseId,
      copyCategories,
    });

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({ message: "Sao chép thành công", ...result });
  } catch (err) {
    console.error("❌ Copy between courses error:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ PROMOTE: Course Bank → Global Bank ------------ */
router.post("/promote-to-global", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { questionIds, sourceCourseId, skipDuplicateCheck } = req.body;

    if (!questionIds || !questionIds.length) {
      return res.status(400).json({ message: "Thiếu danh sách câu hỏi" });
    }

    const result = await promoteToGlobal({
      questionIds,
      sourceCourseId,
      skipDuplicateCheck,
    });

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Promote to global error:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

module.exports = router;
