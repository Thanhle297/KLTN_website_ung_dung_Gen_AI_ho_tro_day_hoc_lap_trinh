const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");

/* -------------------- Helper: Get Next Lesson ID (Atomic) -------------------- */
async function getNextLessonId(db) {
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: "lesson_id" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

  return `BAI_${result.seq}`;
}

/* -------- GET lessons by course -------- */
router.get("/course/:courseId", authMiddleware, async (req, res) => {
  const list = await getDB()
    .collection("lessons")
    .find({ courseId: req.params.courseId })
    .sort({ order: 1 })
    .toArray();
  res.json(list);
});

/* -------- GET 1 lesson -------- */
router.get("/:lessonId", authMiddleware, async (req, res) => {
  const { courseId } = req.query;
  const query = { lessonId: req.params.lessonId };
  if (courseId) query.courseId = courseId;

  const doc = await getDB().collection("lessons").findOne(query);
  res.json(doc);
});

/* -------- GET bài lớn hoặc subLesson -------- */
router.get("/detail/:lessonId", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const lessonId = req.params.lessonId;
    const { courseId } = req.query;

    // 1) BÀI LỚN
    const query = { lessonId };
    if (courseId) query.courseId = courseId;

    const main = await db.collection("lessons").findOne(query);

    if (main) {
      if (Array.isArray(main.subLessons)) {
        for (const sub of main.subLessons) {
          // Khi đếm câu hỏi cho subLesson, cũng phải gán với courseId của bài lớn
          const qQuery = { lessonId: sub.lessonId };
          if (main.courseId) qQuery.courseId = main.courseId;

          const count = await db.collection("question").countDocuments(qQuery);
          sub.questionCount = count;
        }
      }
      return res.json(main);
    }

    // 2) SUBLESSON (Trong trường hợp lessonId là của 1 subLesson)
    const parentQuery = { "subLessons.lessonId": lessonId };
    if (courseId) parentQuery.courseId = courseId;

    const parent = await db.collection("lessons").findOne(parentQuery);

    if (!parent) {
      return res.status(404).json({ error: "Không tìm thấy bài học" });
    }

    const sub = parent.subLessons.find((s) => s.lessonId === lessonId);

    // Đếm câu hỏi cho subLesson này (gắn với courseId của bài cha)
    const qQuerySub = { lessonId: sub.lessonId };
    if (parent.courseId) qQuerySub.courseId = parent.courseId;
    const count = await db.collection("question").countDocuments(qQuerySub);

    sub.questionCount = count;
    sub.parentLesson = {
      lessonId: parent.lessonId,
      title: parent.title,
    };
    // Fallback: nếu sublesson chưa có lessonNumber (dữ liệu cũ), kế thừa từ lesson cha
    if (sub.lessonNumber === undefined || sub.lessonNumber === null) {
      sub.lessonNumber = parent.lessonNumber;
    }

    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------- CREATE -------- */
router.post("/", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const db = getDB();
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

    // Tự động sinh lessonId
    const lessonId = await getNextLessonId(db);

    // Đảm bảo lessonNumber lưu dạng Number
    const data = { ...req.body, lessonNumber: num, lessonId };
    delete data._id;

    await db.collection("lessons").insertOne(data);
    res.json({ message: "Lesson created", lessonId });
  } catch (err) {
    console.error("❌ Tạo lesson lỗi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* -------- UPDATE -------- */
router.put("/:lessonId", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { courseId } = req.query;
    const data = { ...req.body };
    delete data._id;

    const query = { lessonId: req.params.lessonId };
    if (courseId) query.courseId = courseId;

    const result = await getDB()
      .collection("lessons")
      .updateOne(query, { $set: data });

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
  const { courseId } = req.query;
  const query = { lessonId: req.params.lessonId };
  if (courseId) query.courseId = courseId;

  const result = await getDB().collection("lessons").deleteOne(query);
  res.json({ message: "Lesson deleted", deletedCount: result.deletedCount });
});

/* -------- REORDER LESSONS -------- */
// Cập nhật thứ tự lessons theo mảng lessonIds
router.put("/reorder/batch", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { courseId, lessonIds } = req.body;

    if (!courseId || !Array.isArray(lessonIds)) {
      return res.status(400).json({
        message: "Thiếu courseId hoặc lessonIds",
      });
    }

    const db = getDB();
    const bulkOps = lessonIds.map((lessonId, index) => ({
      updateOne: {
        filter: { lessonId, courseId },
        update: { $set: { order: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await db.collection("lessons").bulkWrite(bulkOps);
    }

    res.json({
      message: "Cập nhật thứ tự thành công",
      count: bulkOps.length,
    });
  } catch (err) {
    console.error("❌ Reorder lessons error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
