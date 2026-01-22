const express = require("express");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");
const { getDB } = require("../config/mongodb");

const router = express.Router();

// Middleware: Chỉ admin
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
  }
  next();
}

// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file CSV"));
    }
  },
});

/* ============================================
   POST /api/csv/import-enrollments
   Import enrollments từ file CSV
   Format: username,courseId
=============================================== */
router.post(
  "/import-enrollments",
  authMiddleware,
  adminOnly,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Vui lòng upload file CSV" });
      }

      const db = req.app.locals.db;
      const csvContent = req.file.buffer.toString("utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());

      // Bỏ qua header row
      const dataLines = lines.slice(1);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const line of dataLines) {
        const [username, courseId] = line.split(",").map((s) => s.trim());

        if (!username || !courseId) {
          errorCount++;
          errors.push(`Dòng không hợp lệ: ${line}`);
          continue;
        }

        try {
          // Tìm user theo username
          const user = await db.collection("users").findOne({ username });
          if (!user) {
            errorCount++;
            errors.push(`Không tìm thấy user: ${username}`);
            continue;
          }

          // Kiểm tra course tồn tại
          const course = await db.collection("courses").findOne({ courseId });
          if (!course) {
            errorCount++;
            errors.push(`Không tìm thấy khóa học: ${courseId}`);
            continue;
          }

          // Thêm courseId vào enrolledCourses
          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $addToSet: { enrolledCourses: courseId },
              $set: { updatedAt: new Date() },
            }
          );

          successCount++;
        } catch (err) {
          errorCount++;
          errors.push(`Lỗi xử lý ${username}: ${err.message}`);
        }
      }

      res.json({
        message: "Import hoàn tất",
        success: successCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 10), // Chỉ trả về 10 lỗi đầu tiên
      });
    } catch (error) {
      console.error("❌ CSV import error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

/* ============================================
   GET /api/csv/export-enrollments
   Export enrollments ra file CSV
=============================================== */
router.get(
  "/export-enrollments",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const db = req.app.locals.db;

      // Lấy tất cả users có enrolledCourses
      const users = await db
        .collection("users")
        .find({
          role: "user",
          enrolledCourses: { $exists: true, $ne: [] },
        })
        .toArray();

      // Tạo CSV content
      let csvContent = "username,courseId\n";

      for (const user of users) {
        for (const courseId of user.enrolledCourses || []) {
          csvContent += `${user.username},${courseId}\n`;
        }
      }

      // Set headers để download file
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=enrollments.csv"
      );
      res.send(csvContent);
    } catch (error) {
      console.error("❌ CSV export error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

/* ============================================
   GET /api/csv/template
   Tải file CSV mẫu
=============================================== */
router.get("/template", authMiddleware, adminOnly, (req, res) => {
  const template = "username,courseId\n3560796785,10\n0118177617,11\n";

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=enrollment_template.csv"
  );
  res.send(template);
});

/* ============================================
   GET /api/csv/export-scores/:courseId
   Xuất điểm học sinh theo khóa học ra file CSV
   Cho phép admin và teacher truy cập
=============================================== */
router.get(
  "/export-scores/:courseId",
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

      // Tạo danh sách tất cả subLessons
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

      // 4. Lấy tiến độ của tất cả học sinh
      const studentIds = students.map((s) => s._id.toString());
      const allProgress = await db
        .collection("sublesson_progress")
        .find({
          userId: { $in: studentIds },
          courseId: courseId,
        })
        .toArray();

      // Tạo map để tra cứu nhanh
      const progressMap = {};
      for (const p of allProgress) {
        const key = `${p.userId}_${p.subLessonId}`;
        progressMap[key] = p;
      }

      // 5. Tạo CSV content
      // Header: MSSV, Họ tên, [Bài 1.1], [Bài 1.2], ..., Trung bình
      const headers = ["MSSV", "Ho ten"];
      for (const sub of structure) {
        // Tạo tên cột ngắn gọn, loại bỏ dấu tiếng Việt
        const colName = `${sub.lessonTitle} - ${sub.subLessonTitle}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D");
        headers.push(colName);
      }
      headers.push("Trung binh (%)");

      let csvContent = headers.join(",") + "\n";

      // Sắp xếp học sinh theo tên
      students.sort((a, b) =>
        (a.fullname || a.username).localeCompare(
          b.fullname || b.username,
          "vi"
        )
      );

      // Dữ liệu từng học sinh
      for (const student of students) {
        const row = [];

        // MSSV
        row.push(student.username);

        // Họ tên (loại bỏ dấu để tránh lỗi encoding)
        const fullname = (student.fullname || student.username)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D");
        row.push(`"${fullname}"`);

        // Điểm từng bài
        let totalProgress = 0;
        for (const sub of structure) {
          const key = `${student._id.toString()}_${sub.subLessonId}`;
          const progressDoc = progressMap[key];
          const progress = progressDoc?.progress || 0;
          row.push(progress);
          totalProgress += progress;
        }

        // Trung bình
        const average =
          structure.length > 0
            ? Math.round(totalProgress / structure.length)
            : 0;
        row.push(average);

        csvContent += row.join(",") + "\n";
      }

      // 6. Tạo tên file
      const courseName = course.title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "_");
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Diem_${courseName}_${timestamp}.csv`;

      // 7. Trả về file CSV
      // Thêm BOM để Excel hiển thị đúng UTF-8
      const BOM = "\uFEFF";
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(BOM + csvContent);
    } catch (error) {
      console.error("❌ Export scores CSV error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xuất CSV",
        error: error.message,
      });
    }
  }
);

module.exports = router;
