const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

/* -------------------- Helper: Get Next ID (Atomic) -------------------- */
async function getNextQuestionId(db) {
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: "question_id" },
      { $inc: { seq: 1 } },
      { upsert: true }
    );

  if (!result.value) {
    const doc = await db.collection("counters").findOne({ _id: "question_id" });
    return doc.seq;
  }

  return result.value.seq;
}

/* ------------ GET All / by lessonId or isBank ------------ */
router.get("/", async (req, res) => {
  const { lessonId, isBank, category } = req.query;
  const query = {};

  if (lessonId) query.lessonId = lessonId;
  if (isBank === "true") query.isBank = true;
  if (category) query.category = { $regex: category, $options: "i" };

  const list = await getDB()
    .collection("question")
    .find(query)
    .sort({ id: 1 })
    .toArray();

  res.json(list);
});

/* ------------ ASSIGN (Clone from Bank) ------------ */
router.post("/assign", async (req, res) => {
  try {
    const { questionIds, targetLessonId } = req.body;
    const db = getDB();

    const sources = await db
      .collection("question")
      .find({ id: { $in: questionIds } })
      .toArray();

    if (!sources.length) return res.json({ message: "No questions found" });

    const newDocs = [];

    for (const q of sources) {
      const newId = await getNextQuestionId(db);
      const { _id, id, isBank, ...rest } = q;

      newDocs.push({
        ...rest,
        id: newId,
        lessonId: targetLessonId,
        isBank: false,
      });
    }

    if (newDocs.length) await db.collection("question").insertMany(newDocs);

    res.json({
      message: `Assigned ${newDocs.length} questions`,
      count: newDocs.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------ GET one ------------ */
router.get("/:id", async (req, res) => {
  const doc = await getDB()
    .collection("question")
    .findOne({ id: Number(req.params.id) });

  res.json(doc);
});

/* ------------ CREATE ------------ */
router.post("/", async (req, res) => {
  const db = getDB();
  const newId = await getNextQuestionId(db);

  await db.collection("question").insertOne({ ...req.body, id: newId });

  res.json({ message: "Question created", id: newId });
});

/* ------------ UPDATE ------------ */
router.put("/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    delete data._id;
    delete data.id; // 🔒 cấm update ID

    const result = await getDB()
      .collection("question")
      .updateOne({ id: Number(req.params.id) }, { $set: data });

    res.json({ message: "Question updated", matched: result.matchedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------ DELETE ------------ */
router.delete("/:id", async (req, res) => {
  await getDB()
    .collection("question")
    .deleteOne({ id: Number(req.params.id) });

  res.json({ message: "Question deleted" });
});

module.exports = router;
