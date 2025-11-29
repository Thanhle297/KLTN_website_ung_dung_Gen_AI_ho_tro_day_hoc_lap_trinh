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
  const doc = await getDB()
    .collection("lessons")
    .findOne({ lessonId: req.params.lessonId });
  res.json(doc);
});

/* -------- GET bài lớn hoặc subLesson -------- */
router.get("/detail/:lessonId", async (req, res) => {
  try {
    const db = getDB();
    const lessonId = req.params.lessonId;

    // 1) BÀI LỚN
    const main = await db.collection("lessons").findOne({ lessonId });

    if (main) {
      if (Array.isArray(main.subLessons)) {
        for (const sub of main.subLessons) {
          const count = await db
            .collection("question")
            .countDocuments({ lessonId: sub.lessonId });

          sub.questionCount = count;
        }
      }
      return res.json(main);
    }

    // 2) SUBLESSON
    const parent = await db.collection("lessons").findOne({
      "subLessons.lessonId": lessonId,
    });

    if (!parent) {
      return res.status(404).json({ error: "Không tìm thấy bài học" });
    }

    const sub = parent.subLessons.find((s) => s.lessonId === lessonId);

    const count = await db
      .collection("question")
      .countDocuments({ lessonId });

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
  await getDB().collection("lessons").updateOne(
    { lessonId: req.params.lessonId },
    { $set: req.body }
  );
  res.json({ message: "Lesson updated" });
});

/* -------- DELETE -------- */
router.delete("/:lessonId", async (req, res) => {
  await getDB().collection("lessons").deleteOne({ lessonId: req.params.lessonId });
  res.json({ message: "Lesson deleted" });
});

module.exports = router;
