const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");
const {
  getSubLessons,
  createSubLesson,
  updateSubLesson,
  deleteSubLesson,
  reorderSubLessons,
} = require("../services/lessonService");

/* -------- GET subLessons -------- */
router.get("/:lessonId/sub", authMiddleware, async (req, res) => {
  try {
    const subs = await getSubLessons(req.params.lessonId, req.query.courseId);
    res.json(subs);
  } catch (err) {
    console.error("❌ Get subLessons error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------- CREATE subLesson -------- */
router.post("/:lessonId/sub", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const courseId = req.query.courseId || req.body.courseId;
    const result = await createSubLesson(req.params.lessonId, req.body, courseId);

    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy bài học cha" });
    }

    res.json({ message: "SubLesson added", lessonId: result.subLessonId });
  } catch (err) {
    console.error("❌ Tạo subLesson lỗi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* -------- UPDATE subLesson -------- */
router.put("/:lessonId/sub/:subId", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const courseId = req.query.courseId || req.body.courseId;
    const found = await updateSubLesson(req.params.lessonId, req.params.subId, req.body, courseId);

    if (!found) {
      return res.status(404).json({ message: "Không tìm thấy bài học cha" });
    }

    res.json({ message: "SubLesson updated" });
  } catch (err) {
    console.error("❌ Cập nhật subLesson lỗi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* -------- DELETE subLesson -------- */
router.delete("/:lessonId/sub/:subId", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    await deleteSubLesson(req.params.lessonId, req.params.subId, req.query.courseId);
    res.json({ message: "SubLesson deleted" });
  } catch (err) {
    console.error("❌ Delete subLesson error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------- REORDER subLessons -------- */
router.put("/:lessonId/reorder", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { subLessonIds } = req.body;

    if (!Array.isArray(subLessonIds)) {
      return res.status(400).json({ message: "Thiếu subLessonIds" });
    }

    const count = await reorderSubLessons(
      req.params.lessonId,
      subLessonIds,
      req.query.courseId,
    );

    if (count === null) {
      return res.status(404).json({ message: "Không tìm thấy bài học" });
    }

    res.json({ message: "Cập nhật thứ tự subLessons thành công", count });
  } catch (err) {
    console.error("❌ Reorder subLessons error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
