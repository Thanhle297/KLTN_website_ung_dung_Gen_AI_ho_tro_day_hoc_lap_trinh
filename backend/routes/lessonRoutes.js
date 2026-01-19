const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

/* -------- GET lessons by course -------- */
router.get("/course/:courseId", async (req, res) => {
  const list = await getDB()
    .collection("lessons")
    .find({ courseId: req.params.courseId })
    .sort({ order: 1 })
    .toArray();
  res.json(list);
});

/* -------- GET 1 lesson -------- */
router.get("/:lessonId", async (req, res) => {
  const { courseId } = req.query;
  const query = { lessonId: req.params.lessonId };
  if (courseId) query.courseId = courseId;

  const doc = await getDB().collection("lessons").findOne(query);
  res.json(doc);
});

/* -------- GET bài lớn hoặc subLesson -------- */
router.get("/detail/:lessonId", async (req, res) => {
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

    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------- CREATE -------- */
router.post("/", async (req, res) => {
  await getDB().collection("lessons").insertOne(req.body);
  res.json({ message: "Lesson created" });
});

/* -------- UPDATE -------- */
router.put("/:lessonId", async (req, res) => {
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
router.delete("/:lessonId", async (req, res) => {
  const { courseId } = req.query;
  const query = { lessonId: req.params.lessonId };
  if (courseId) query.courseId = courseId;

  const result = await getDB().collection("lessons").deleteOne(query);
  res.json({ message: "Lesson deleted", deletedCount: result.deletedCount });
});

module.exports = router;
