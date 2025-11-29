const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

/* -------- GET subLessons -------- */
router.get("/:lessonId/sub", async (req, res) => {
  const doc = await getDB()
    .collection("lessons")
    .findOne({ lessonId: req.params.lessonId });

  res.json(doc?.subLessons || []);
});

/* -------- CREATE subLesson -------- */
router.post("/:lessonId/sub", async (req, res) => {
  await getDB().collection("lessons").updateOne(
    { lessonId: req.params.lessonId },
    { $push: { subLessons: req.body } }
  );
  res.json({ message: "SubLesson added" });
});

/* -------- UPDATE subLesson -------- */
router.put("/:lessonId/sub/:subId", async (req, res) => {
  await getDB().collection("lessons").updateOne(
    { lessonId: req.params.lessonId, "subLessons.lessonId": req.params.subId },
    { $set: { "subLessons.$": req.body } }
  );
  res.json({ message: "SubLesson updated" });
});

/* -------- DELETE subLesson -------- */
router.delete("/:lessonId/sub/:subId", async (req, res) => {
  await getDB().collection("lessons").updateOne(
    { lessonId: req.params.lessonId },
    { $pull: { subLessons: { lessonId: req.params.subId } } }
  );
  res.json({ message: "SubLesson deleted" });
});

module.exports = router;
