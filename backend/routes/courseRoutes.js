const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");
const { adminOnly } = require("../middleware/coursePermission");
const {
  getAllCourses,
  getMyCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  checkCanEdit,
  getCourseTeachers,
  setTeachers,
  addTeacher,
  removeTeacher,
  getCourseReport,
} = require("../services/courseService");

// GET all (admin only - trả về tất cả courses)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await getAllCourses();
    res.json(data);
  } catch (error) {
    console.error("❌ Get all courses error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// GET my-courses (user - chỉ trả về courses được phân vào)
router.get("/my-courses", authMiddleware, async (req, res) => {
  try {
    const courses = await getMyCourses(req.user.id, req.user.role);
    res.json(courses);
  } catch (error) {
    console.error("❌ Get my-courses error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// GET one
router.get("/:courseId", authMiddleware, async (req, res) => {
  try {
    const doc = await getCourseById(req.params.courseId);
    res.json(doc);
  } catch (error) {
    console.error("❌ Get course error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// CREATE
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const courseId = await createCourse(req.body);
    res.json({ message: "Course created", courseId });
  } catch (err) {
    console.error("❌ Tạo course lỗi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// UPDATE
router.put("/:courseId", authMiddleware, async (req, res) => {
  try {
    await updateCourse(req.params.courseId, req.body);
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
      const report = await getCourseReport(req.params.courseId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      res.json({ success: true, ...report });
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
=============================================== */
router.get("/:courseId/can-edit", authMiddleware, async (req, res) => {
  try {
    const result = await checkCanEdit(
      req.params.courseId,
      req.user.id,
      req.user.role,
    );

    if (result.message) {
      return res.status(404).json(result);
    }

    res.json(result);
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
=============================================== */
router.get("/:courseId/teachers", authMiddleware, async (req, res) => {
  try {
    const { course, teachers } = await getCourseTeachers(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    res.json(teachers);
  } catch (error) {
    console.error("❌ Get course teachers error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   POST /api/courses/:courseId/teachers
   Gán danh sách teachers cho khóa học (thay thế toàn bộ)
=============================================== */
router.post("/:courseId/teachers", authMiddleware, async (req, res) => {
  try {
    // Chỉ admin mới có quyền
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin mới có quyền gán giáo viên cho khóa học",
      });
    }

    const { teacherIds } = req.body;

    if (!Array.isArray(teacherIds)) {
      return res.status(400).json({ message: "teacherIds phải là mảng" });
    }

    const result = await setTeachers(req.params.courseId, teacherIds);

    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    res.json({
      message: "Cập nhật danh sách giáo viên thành công",
      teacherIds,
    });
  } catch (error) {
    console.error("❌ Set course teachers error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   PUT /api/courses/:courseId/teachers/add
=============================================== */
router.put("/:courseId/teachers/add", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin mới có quyền thêm giáo viên",
      });
    }

    const { teacherId } = req.body;
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId là bắt buộc" });
    }

    await addTeacher(req.params.courseId, teacherId);
    res.json({ message: "Thêm giáo viên thành công", teacherId });
  } catch (error) {
    console.error("❌ Add course teacher error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   PUT /api/courses/:courseId/teachers/remove
=============================================== */
router.put("/:courseId/teachers/remove", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin mới có quyền xóa giáo viên",
      });
    }

    const { teacherId } = req.body;
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId là bắt buộc" });
    }

    await removeTeacher(req.params.courseId, teacherId);
    res.json({ message: "Xóa giáo viên thành công", teacherId });
  } catch (error) {
    console.error("❌ Remove course teacher error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// DELETE
router.delete("/:courseId", authMiddleware, adminOnly, async (req, res) => {
  try {
    await deleteCourse(req.params.courseId);
    res.json({ message: "Course deleted" });
  } catch (error) {
    console.error("❌ Delete course error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

module.exports = router;
