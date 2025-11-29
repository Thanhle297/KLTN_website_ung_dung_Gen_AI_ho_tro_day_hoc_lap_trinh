//questionRoutes
const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

/* ------------ GET All / by lessonId ------------ */
router.get("/", async (req, res) => {
  const { lessonId } = req.query;

  const query = lessonId ? { lessonId } : {};
  const list = await getDB()
    .collection("question")
    .find(query)
    .sort({ id: 1 })
    .toArray();

  res.json(list);
});

/* ------------ GET one ------------ */
router.get("/:id", async (req, res) => {
  const doc = await getDB()
    .collection("question")
    .findOne({ id: Number(req.params.id) });

  res.json(doc);
});

/* ------------ CREATE (auto ID) ------------ */
router.post("/", async (req, res) => {
  const db = getDB();

  const last = await db
    .collection("question")
    .find()
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  const newId = last.length ? last[0].id + 1 : 1;

  await db.collection("question").insertOne({ ...req.body, id: newId });

  res.json({ message: "Question created", id: newId });
});

/* ------------ UPDATE ------------ */
router.put("/:id", async (req, res) => {
  await getDB()
    .collection("question")
    .updateOne({ id: Number(req.params.id) }, { $set: req.body });

  res.json({ message: "Question updated" });
});

/* ------------ DELETE ------------ */
router.delete("/:id", async (req, res) => {
  await getDB().collection("question").deleteOne({ id: Number(req.params.id) });
  res.json({ message: "Question deleted" });
});

module.exports = router;
