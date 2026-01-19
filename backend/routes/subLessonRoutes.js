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

module.exports = router;
