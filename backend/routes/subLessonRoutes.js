const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");

/* -------------------- Helper: Get Next SubLesson ID (Atomic) -------------------- */
// Counter riêng cho mỗi lesson cha, đảm bảo format: BAI_1_1, BAI_1_2, ...
async function getNextSubLessonId(db, parentLessonId) {
  const counterId = `sublesson_${parentLessonId}`;
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

  return `${parentLessonId}_${result.seq}`;
}

/* -------- GET subLessons -------- */
router.get("/:lessonId/sub", authMiddleware, async (req, res) => {
  const { courseId } = req.query;
  const query = { lessonId: req.params.lessonId };
  if (courseId) query.courseId = courseId;

  const doc = await getDB().collection("lessons").findOne(query);

  res.json(doc?.subLessons || []);
});

/* -------- CREATE subLesson -------- */
router.post("/:lessonId/sub", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const parentLessonId = req.params.lessonId;
    const { courseId } = req.query || req.body;
    const query = { lessonId: parentLessonId };
    if (courseId) query.courseId = courseId;

    // Lấy lesson cha để kế thừa lessonNumber
    const parentLesson = await db.collection("lessons").findOne(query);
    if (!parentLesson) {
      return res.status(404).json({ message: "Không tìm thấy bài học cha" });
    }

    // Tự động sinh lessonId cho subLesson (format: BAI_1_1, BAI_1_2, ...)
    const subLessonId = await getNextSubLessonId(db, parentLessonId);
    const data = {
      ...req.body,
      lessonId: subLessonId,
      // Kế thừa lessonNumber từ lesson cha
      lessonNumber: parentLesson.lessonNumber,
    };

    await db
      .collection("lessons")
      .updateOne(query, { $push: { subLessons: data } });
    res.json({ message: "SubLesson added", lessonId: subLessonId });
  } catch (err) {
    console.error("❌ Tạo subLesson lỗi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* -------- UPDATE subLesson -------- */
router.put("/:lessonId/sub/:subId", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { courseId } = req.query || req.body;
    const parentQuery = { lessonId: req.params.lessonId };
    if (courseId) parentQuery.courseId = courseId;

    // Lấy lesson cha để kế thừa lessonNumber
    const parentLesson = await db.collection("lessons").findOne(parentQuery);
    if (!parentLesson) {
      return res.status(404).json({ message: "Không tìm thấy bài học cha" });
    }

    const query = {
      lessonId: req.params.lessonId,
      "subLessons.lessonId": req.params.subId,
    };
    if (courseId) query.courseId = courseId;

    // Đảm bảo sublesson luôn có lessonNumber từ lesson cha
    const data = {
      ...req.body,
      lessonNumber: parentLesson.lessonNumber,
    };

    await db
      .collection("lessons")
      .updateOne(query, { $set: { "subLessons.$": data } });
    res.json({ message: "SubLesson updated" });
  } catch (err) {
    console.error("❌ Cập nhật subLesson lỗi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* -------- DELETE subLesson -------- */
router.delete("/:lessonId/sub/:subId", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
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
router.put("/:lessonId/reorder", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
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
