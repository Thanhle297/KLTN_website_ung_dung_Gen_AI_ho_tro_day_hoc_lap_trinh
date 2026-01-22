const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");

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

/* ============================================
   GET /api/courses/:courseId/report
   Lấy báo cáo điểm học sinh theo khóa học
   Chỉ admin hoặc teacher mới có quyền truy cập
=============================================== */
router.get(
  "/:courseId/report",
  authMiddleware,
  teacherOrAdminMiddleware,
  async (req, res) => {
    try {
      const db = getDB();
      const { courseId } = req.params;

      // 1. Lấy thông tin khóa học
      const course = await db.collection("courses").findOne({ courseId });
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      // 2. Lấy danh sách học sinh đã enroll vào khóa học này
      const students = await db
        .collection("users")
        .find({
          enrolledCourses: courseId,
          role: "user",
        })
        .project({
          _id: 1,
          username: 1,
          fullname: 1,
        })
        .toArray();

      // 3. Lấy cấu trúc bài học (lessons + subLessons)
      const lessons = await db
        .collection("lessons")
        .find({ courseId })
        .sort({ order: 1 })
        .toArray();

      // Tạo danh sách tất cả subLessons với thông tin đầy đủ
      const structure = [];
      for (const lesson of lessons) {
        if (Array.isArray(lesson.subLessons)) {
          for (const sub of lesson.subLessons) {
            structure.push({
              lessonId: lesson.lessonId,
              lessonTitle: lesson.title,
              subLessonId: sub.lessonId,
              subLessonTitle: sub.title,
              order: sub.order || 0,
            });
          }
        }
      }

      // Sắp xếp theo thứ tự
      structure.sort((a, b) => a.order - b.order);

      // 4. Lấy tiến độ của tất cả học sinh cho khóa học này
      const studentIds = students.map((s) => s._id.toString());
      const allProgress = await db
        .collection("sublesson_progress")
        .find({
          userId: { $in: studentIds },
          courseId: courseId,
        })
        .toArray();

      // Tạo map để tra cứu nhanh: { `${userId}_${subLessonId}`: progressDoc }
      const progressMap = {};
      for (const p of allProgress) {
        const key = `${p.userId}_${p.subLessonId}`;
        progressMap[key] = p;
      }

      // 5. Xây dựng dữ liệu cho từng học sinh
      const studentsData = students.map((student) => {
        const scores = {};
        let totalProgress = 0;
        let subLessonCount = 0;

        for (const sub of structure) {
          const key = `${student._id.toString()}_${sub.subLessonId}`;
          const progressDoc = progressMap[key];

          scores[sub.subLessonId] = {
            progress: progressDoc?.progress || 0,
            completed: progressDoc?.completed || false,
          };

          totalProgress += progressDoc?.progress || 0;
          subLessonCount++;
        }

        const averageProgress =
          subLessonCount > 0 ? Math.round(totalProgress / subLessonCount) : 0;

        return {
          userId: student._id.toString(),
          username: student.username,
          fullname: student.fullname || student.username,
          scores,
          averageProgress,
        };
      });

      // Sắp xếp theo tên
      studentsData.sort((a, b) => a.fullname.localeCompare(b.fullname, "vi"));

      res.json({
        success: true,
        courseId,
        courseTitle: course.title,
        structure,
        students: studentsData,
        totalStudents: studentsData.length,
        totalSubLessons: structure.length,
      });
    } catch (error) {
      console.error("❌ Get course report error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy báo cáo",
        error: error.message,
      });
    }
  }
);

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
