const express = require("express");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");

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

module.exports = router;
