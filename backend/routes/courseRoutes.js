const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");

// GET all (admin only - trả về tất cả courses)
router.get("/", async (req, res) => {
  const data = await getDB().collection("courses").find().toArray();
  res.json(data);
});

// ✅ GET my-courses (user - chỉ trả về courses được phân vào)
router.get("/my-courses", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    // Admin thấy tất cả courses
    if (req.user.role === "admin") {
      const courses = await db.collection("courses").find().toArray();
      return res.json(courses);
    }

    // User thường chỉ thấy courses được phân vào
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    const enrolledCourses = user?.enrolledCourses || [];

    // Lấy thông tin chi tiết các courses
    const courses = await db
      .collection("courses")
      .find({ courseId: { $in: enrolledCourses } })
      .toArray();

    res.json(courses);
  } catch (error) {
    console.error("❌ Get my-courses error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// GET one
router.get("/:courseId", async (req, res) => {
  const doc = await getDB()
    .collection("courses")
    .findOne({ courseId: req.params.courseId });
  res.json(doc);
});

// CREATE
router.post("/", async (req, res) => {
  await getDB().collection("courses").insertOne(req.body);
  res.json({ message: "Course created" });
});

// UPDATE
router.put("/:courseId", async (req, res) => {
  await getDB()
    .collection("courses")
    .updateOne({ courseId: req.params.courseId }, { $set: req.body });
  res.json({ message: "Course updated" });
});

// DELETE - ✅ Cập nhật để xóa courseId khỏi enrolledCourses của users
router.delete("/:courseId", async (req, res) => {
  const db = getDB();
  const { courseId } = req.params;

  // Xóa course
  await db.collection("courses").deleteOne({ courseId });

  // ⚠️ QUAN TRỌNG: Xóa courseId khỏi enrolledCourses của tất cả user
  await db
    .collection("users")
    .updateMany(
      { enrolledCourses: courseId },
      { $pull: { enrolledCourses: courseId } }
    );

  res.json({ message: "Course deleted" });
});

module.exports = router;
