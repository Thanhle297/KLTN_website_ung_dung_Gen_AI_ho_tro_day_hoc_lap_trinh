const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");

// GET all
router.get("/", async (req, res) => {
  const data = await getDB().collection("courses").find().toArray();
  res.json(data);
});

// GET one
router.get("/:courseId", async (req, res) => {
  const doc = await getDB().collection("courses").findOne({ courseId: req.params.courseId });
  res.json(doc);
});

// CREATE
router.post("/", async (req, res) => {
  await getDB().collection("courses").insertOne(req.body);
  res.json({ message: "Course created" });
});

// UPDATE
router.put("/:courseId", async (req, res) => {
  await getDB().collection("courses").updateOne(
    { courseId: req.params.courseId },
    { $set: req.body }
  );
  res.json({ message: "Course updated" });
});

// DELETE
router.delete("/:courseId", async (req, res) => {
  await getDB().collection("courses").deleteOne({ courseId: req.params.courseId });
  res.json({ message: "Course deleted" });
});

module.exports = router;
