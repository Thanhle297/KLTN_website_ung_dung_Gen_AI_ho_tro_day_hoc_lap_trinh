const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");
const { adminOnly } = require("../middleware/coursePermission");
const {
  importEnrollments,
  exportEnrollments,
  exportScores,
} = require("../services/csvService");

const router = express.Router();

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

      const csvContent = req.file.buffer.toString("utf-8");
      const result = await importEnrollments(csvContent);

      res.json({
        message: "Import hoàn tất",
        success: result.success,
        errors: result.errors,
        errorDetails: result.errorDetails,
      });
    } catch (error) {
      console.error("❌ CSV import error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

/* ============================================
   GET /api/csv/export-enrollments
=============================================== */
router.get(
  "/export-enrollments",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const csvContent = await exportEnrollments();

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
=============================================== */
router.get(
  "/export-scores/:courseId",
  authMiddleware,
  teacherOrAdminMiddleware,
  async (req, res) => {
    try {
      const result = await exportScores(req.params.courseId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      // Thêm BOM để Excel hiển thị đúng UTF-8
      const BOM = "\uFEFF";
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`
      );
      res.send(BOM + result.csvContent);
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
