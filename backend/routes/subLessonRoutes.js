const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

/* -------- GET subLessons -------- */
router.get("/:lessonId/sub", async (req, res) => {
  const { courseId } = req.query;
  const query = { lessonId: req.params.lessonId };
  if (courseId) query.courseId = courseId;

  const doc = await getDB().collection("lessons").findOne(query);

  res.json(doc?.subLessons || []);
});

/* -------- CREATE subLesson -------- */
router.post("/:lessonId/sub", async (req, res) => {
  const { courseId } = req.query || req.body;
  const query = { lessonId: req.params.lessonId };
  if (courseId) query.courseId = courseId;

  await getDB()
    .collection("lessons")
    .updateOne(query, { $push: { subLessons: req.body } });
  res.json({ message: "SubLesson added" });
});

/* -------- UPDATE subLesson -------- */
router.put("/:lessonId/sub/:subId", async (req, res) => {
  const { courseId } = req.query || req.body;
  const query = {
    lessonId: req.params.lessonId,
    "subLessons.lessonId": req.params.subId,
  };
  if (courseId) query.courseId = courseId;

  await getDB()
    .collection("lessons")
    .updateOne(query, { $set: { "subLessons.$": req.body } });
  res.json({ message: "SubLesson updated" });
});

/* -------- DELETE subLesson -------- */
router.delete("/:lessonId/sub/:subId", async (req, res) => {
  const { courseId } = req.query;
  const query = { lessonId: req.params.lessonId };
  if (courseId) query.courseId = courseId;

  await getDB()
    .collection("lessons")
    .updateOne(query, {
      $pull: { subLessons: { lessonId: req.params.subId } },
    });
  res.json({ message: "SubLesson deleted" });
});

/* -------- REORDER subLessons -------- */
// Cập nhật thứ tự subLessons theo mảng subLessonIds
router.put("/:lessonId/reorder", async (req, res) => {
  try {
    const { courseId } = req.query;
    const { subLessonIds } = req.body;
    const { lessonId } = req.params;

    if (!Array.isArray(subLessonIds)) {
      return res.status(400).json({
        message: "Thiếu subLessonIds",
      });
    }

    const db = getDB();
    const query = { lessonId };
    if (courseId) query.courseId = courseId;

    // Lấy lesson hiện tại
    const lesson = await db.collection("lessons").findOne(query);
    if (!lesson) {
      return res.status(404).json({ message: "Không tìm thấy bài học" });
    }

    // Tạo map để tra cứu nhanh subLessons
    const subMap = {};
    for (const sub of lesson.subLessons || []) {
      subMap[sub.lessonId] = sub;
    }

    // Sắp xếp lại theo thứ tự mới và cập nhật order
    const reorderedSubs = subLessonIds
      .map((id, index) => {
        const sub = subMap[id];
        if (sub) {
          return { ...sub, order: index };
        }
        return null;
      })
      .filter(Boolean);

    // Thêm các subLessons không có trong subLessonIds vào cuối
    const existingIds = new Set(subLessonIds);
    let nextOrder = reorderedSubs.length;
    for (const sub of lesson.subLessons || []) {
      if (!existingIds.has(sub.lessonId)) {
        reorderedSubs.push({ ...sub, order: nextOrder++ });
      }
    }

    // Cập nhật lesson với subLessons đã sắp xếp
    await db.collection("lessons").updateOne(query, {
      $set: { subLessons: reorderedSubs },
    });

    res.json({
      message: "Cập nhật thứ tự subLessons thành công",
      count: reorderedSubs.length,
    });
  } catch (err) {
    console.error("❌ Reorder subLessons error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
