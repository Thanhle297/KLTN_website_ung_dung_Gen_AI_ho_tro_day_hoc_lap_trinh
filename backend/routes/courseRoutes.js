const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");

/* -------------------- Helper: Get Next Course ID (Atomic) -------------------- */
async function getNextCourseId(db) {
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: "course_id" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

  return `CRS_${result.seq}`;
}

// GET all (admin only - trả về tất cả courses)
router.get("/", authMiddleware, async (req, res) => {
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

    // Teacher dùng teachingCourses, student dùng enrolledCourses
    const courseIds = req.user.role === "teacher"
      ? (user?.teachingCourses || [])
      : (user?.enrolledCourses || []);

    // Lấy thông tin chi tiết các courses
    const courses = await db
      .collection("courses")
      .find({ courseId: { $in: courseIds } })
      .toArray();

    res.json(courses);
  } catch (error) {
    console.error("❌ Get my-courses error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// GET one
router.get("/:courseId", authMiddleware, async (req, res) => {
  const doc = await getDB()
    .collection("courses")
    .findOne({ courseId: req.params.courseId });
  res.json(doc);
});

// CREATE
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
  }
  next();
}

router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = getDB();

    // Tự động sinh courseId
    const courseId = await getNextCourseId(db);
    const data = { ...req.body, courseId };
    delete data._id;

    await db.collection("courses").insertOne(data);
    res.json({ message: "Course created", courseId });
  } catch (err) {
    console.error("❌ Tạo course lỗi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// UPDATE
router.put("/:courseId", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { courseId } = req.params;

    // Nếu có teacherIds trong body, đồng bộ teachingCourses
    if (Array.isArray(req.body.teacherIds)) {
      const course = await db.collection("courses").findOne({ courseId });
      const oldTeacherIds = course?.teacherIds || [];
      const newTeacherIds = req.body.teacherIds;

      // Giáo viên MỚI được thêm
      const addedTeachers = newTeacherIds.filter(
        (id) => !oldTeacherIds.includes(id),
      );
      if (addedTeachers.length > 0) {
        await db.collection("users").updateMany(
          { _id: { $in: addedTeachers.map((id) => new ObjectId(id)) } },
          {
            $addToSet: { teachingCourses: courseId },
            $set: { updatedAt: new Date() },
          },
        );
      }

      // Giáo viên BỊ XÓA
      const removedTeachers = oldTeacherIds.filter(
        (id) => !newTeacherIds.includes(id),
      );
      if (removedTeachers.length > 0) {
        await db.collection("users").updateMany(
          { _id: { $in: removedTeachers.map((id) => new ObjectId(id)) } },
          {
            $pull: { teachingCourses: courseId },
            $set: { updatedAt: new Date() },
          },
        );
      }
    }

    await db.collection("courses").updateOne({ courseId }, { $set: req.body });

    res.json({ message: "Cập nhật khóa học thành công" });
  } catch (error) {
    console.error("❌ Update course error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
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
  },
);

/* ============================================
   GET /api/courses/:courseId/can-edit
   Kiểm tra user có quyền edit khóa học hay không
   - Admin: luôn có quyền
   - Teacher: chỉ khi được gán vào teacherIds
   - User: không có quyền
=============================================== */
router.get("/:courseId/can-edit", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin luôn có quyền edit
    if (userRole === "admin") {
      return res.json({ canEdit: true, role: "admin" });
    }

    // Lấy thông tin course
    const course = await db.collection("courses").findOne({ courseId });
    if (!course) {
      return res.status(404).json({
        canEdit: false,
        role: userRole,
        message: "Không tìm thấy khóa học",
      });
    }

    // Teacher: kiểm tra có trong teacherIds không
    if (userRole === "teacher") {
      const teacherIds = course.teacherIds || [];
      const isTeacherOfCourse = teacherIds.includes(userId);

      return res.json({
        canEdit: isTeacherOfCourse,
        role: "teacher",
        isTeacherOfCourse,
      });
    }

    // User thường: không có quyền edit
    return res.json({ canEdit: false, role: userRole || "user" });
  } catch (error) {
    console.error("❌ Check can-edit error:", error);
    res.status(500).json({
      canEdit: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/* ============================================
   GET /api/courses/:courseId/teachers
   Lấy danh sách teachers được gán cho khóa học
   - Admin: xem tất cả
   - Teacher: chỉ xem nếu là teacher của course đó
=============================================== */
router.get("/:courseId/teachers", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { courseId } = req.params;

    // Lấy thông tin course
    const course = await db.collection("courses").findOne({ courseId });
    if (!course) {
      return res.status(404).json({
        message: "Không tìm thấy khóa học",
      });
    }

    const teacherIds = course.teacherIds || [];

    // Lấy thông tin chi tiết các teachers
    const teachers = await db
      .collection("users")
      .find(
        { _id: { $in: teacherIds.map((id) => new ObjectId(id)) } },
        { projection: { _id: 1, username: 1, fullname: 1, email: 1, role: 1 } },
      )
      .toArray();

    res.json(teachers);
  } catch (error) {
    console.error("❌ Get course teachers error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/* ============================================
   POST /api/courses/:courseId/teachers
   Gán danh sách teachers cho khóa học (thay thế toàn bộ)
   - Admin only
=============================================== */
router.post("/:courseId/teachers", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { courseId } = req.params;
    const { teacherIds } = req.body;

    // Chỉ admin mới có quyền
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin mới có quyền gán giáo viên cho khóa học",
      });
    }

    if (!Array.isArray(teacherIds)) {
      return res.status(400).json({
        message: "teacherIds phải là mảng",
      });
    }

    // Lấy danh sách giáo viên cũ để so sánh
    const course = await db.collection("courses").findOne({ courseId });
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    const oldTeacherIds = course.teacherIds || [];

    // Cập nhật teacherIds cho course
    await db
      .collection("courses")
      .updateOne({ courseId }, { $set: { teacherIds } });

    // Đồng bộ teachingCourses:
    // Giáo viên MỚI được thêm → thêm courseId vào teachingCourses
    const addedTeachers = teacherIds.filter(
      (id) => !oldTeacherIds.includes(id),
    );
    if (addedTeachers.length > 0) {
      await db.collection("users").updateMany(
        { _id: { $in: addedTeachers.map((id) => new ObjectId(id)) } },
        {
          $addToSet: { teachingCourses: courseId },
          $set: { updatedAt: new Date() },
        },
      );
    }

    // Giáo viên BỊ XÓA → xóa courseId khỏi teachingCourses
    const removedTeachers = oldTeacherIds.filter(
      (id) => !teacherIds.includes(id),
    );
    if (removedTeachers.length > 0) {
      await db.collection("users").updateMany(
        { _id: { $in: removedTeachers.map((id) => new ObjectId(id)) } },
        {
          $pull: { teachingCourses: courseId },
          $set: { updatedAt: new Date() },
        },
      );
    }

    res.json({
      message: "Cập nhật danh sách giáo viên thành công",
      teacherIds,
    });
  } catch (error) {
    console.error("❌ Set course teachers error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/* ============================================
   PUT /api/courses/:courseId/teachers/add
   Thêm 1 teacher vào khóa học
   - Admin only
=============================================== */
router.put("/:courseId/teachers/add", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { courseId } = req.params;
    const { teacherId } = req.body;

    // Chỉ admin mới có quyền
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin mới có quyền thêm giáo viên",
      });
    }

    if (!teacherId) {
      return res.status(400).json({
        message: "teacherId là bắt buộc",
      });
    }

    // Thêm teacherId vào mảng (không trùng)
    await db
      .collection("courses")
      .updateOne({ courseId }, { $addToSet: { teacherIds: teacherId } });

    await db.collection("users").updateOne(
      { _id: new ObjectId(teacherId) },
      {
        $addToSet: { teachingCourses: courseId },
        $set: { updatedAt: new Date() },
      },
    );

    res.json({
      message: "Thêm giáo viên thành công",
      teacherId,
    });
  } catch (error) {
    console.error("❌ Add course teacher error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/* ============================================
   PUT /api/courses/:courseId/teachers/remove
   Xóa 1 teacher khỏi khóa học
   - Admin only
=============================================== */
router.put("/:courseId/teachers/remove", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { courseId } = req.params;
    const { teacherId } = req.body;

    // Chỉ admin mới có quyền
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin mới có quyền xóa giáo viên",
      });
    }

    if (!teacherId) {
      return res.status(400).json({
        message: "teacherId là bắt buộc",
      });
    }

    // Xóa teacherId khỏi mảng
    await db
      .collection("courses")
      .updateOne({ courseId }, { $pull: { teacherIds: teacherId } });

    // Đồng bộ: xóa courseId khỏi teachingCourses của giáo viên
    await db.collection("users").updateOne(
      { _id: new ObjectId(teacherId) },
      {
        $pull: { teachingCourses: courseId },
        $set: { updatedAt: new Date() },
      },
    );

    res.json({
      message: "Xóa giáo viên thành công",
      teacherId,
    });
  } catch (error) {
    console.error("❌ Remove course teacher error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// DELETE - Cập nhật để xóa courseId khỏi enrolledCourses của students và teachingCourses của teachers
router.delete("/:courseId", authMiddleware, adminOnly, async (req, res) => {
  const db = getDB();
  const { courseId } = req.params;

  // Xóa course
  await db.collection("courses").deleteOne({ courseId });

  // Xóa courseId khỏi enrolledCourses của students
  await db
    .collection("users")
    .updateMany(
      { enrolledCourses: courseId },
      { $pull: { enrolledCourses: courseId } },
    );

  // Xóa courseId khỏi teachingCourses của teachers
  await db
    .collection("users")
    .updateMany(
      { teachingCourses: courseId },
      { $pull: { teachingCourses: courseId } },
    );

  res.json({ message: "Course deleted" });
});

module.exports = router;
