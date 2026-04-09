// routes/categoryRoutes.js
// CRUD danh mục (categories) cho ngân hàng câu hỏi
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireCourseAccess } = require("../middleware/coursePermission");
const {
  getCategories,
  getCategoriesByCourse,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  checkCategoryPermission,
  copyCategories,
} = require("../services/categoryService");

// Tất cả routes đều yêu cầu auth
router.use(authMiddleware);

/* ------------ GET / - Lấy danh mục theo courseId ------------ */
router.get("/", async (req, res) => {
  try {
    const categories = await getCategories(req.query.courseId);
    res.json({ categories });
  } catch (err) {
    console.error("❌ Lỗi lấy danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ GET /by-course/:courseId ------------ */
router.get("/by-course/:courseId", async (req, res) => {
  try {
    const categories = await getCategoriesByCourse(req.params.courseId);
    res.json({ categories });
  } catch (err) {
    console.error("❌ Lỗi lấy danh mục theo khóa:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ POST / - Tạo danh mục mới ------------ */
router.post("/", requireCourseAccess, async (req, res) => {
  try {
    const { courseId, name, description } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "Tên danh mục không được để trống" });
    }

    const newCategory = await createCategory({ courseId, name, description });

    res.status(201).json({
      message: "Tạo danh mục thành công",
      category: newCategory,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Danh mục đã tồn tại trong khóa này" });
    }
    console.error("❌ Lỗi tạo danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ PUT /:id - Cập nhật danh mục ------------ */
router.put("/:id", async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    // Kiểm tra quyền
    const perm = await checkCategoryPermission(category, req.user);
    if (!perm.allowed) {
      return res.status(403).json({ message: perm.message });
    }

    const result = await updateCategory(req.params.id, req.body, category);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({ message: "Cập nhật danh mục thành công" });
  } catch (err) {
    console.error("❌ Lỗi cập nhật danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ DELETE /:id - Xóa danh mục ------------ */
router.delete("/:id", async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    // Kiểm tra quyền
    const perm = await checkCategoryPermission(category, req.user);
    if (!perm.allowed) {
      return res.status(403).json({ message: perm.message });
    }

    const result = await deleteCategory(req.params.id);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({ message: "Xóa danh mục thành công" });
  } catch (err) {
    console.error("❌ Lỗi xóa danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ POST /copy - Sao chép danh mục giữa khóa ------------ */
router.post("/copy", requireCourseAccess, async (req, res) => {
  try {
    const { sourceCourseId, targetCourseId } = req.body;
    const { ObjectId } = require("mongodb");
    const { getDB } = require("../config/mongodb");

    // Validate quyền đọc khóa nguồn
    const { role, id } = req.user;
    if (role !== "admin") {
      if (!sourceCourseId || sourceCourseId === "null") {
        return res.status(403).json({ message: "Chỉ admin mới có quyền sao chép từ Ngân hàng chung" });
      } else {
        const db = getDB();
        const user = await db.collection("users").findOne(
          { _id: new ObjectId(id) },
          { projection: { teachingCourses: 1 } }
        );
        const teachingCourses = (user?.teachingCourses || []).map(cid => cid.toString());
        if (!teachingCourses.includes(sourceCourseId.toString())) {
          return res.status(403).json({ message: "Bạn không có quyền đọc danh mục từ khóa nguồn này" });
        }
      }
    }

    if (sourceCourseId === targetCourseId) {
      return res.status(400).json({ message: "Khóa nguồn và khóa đích không được trùng nhau" });
    }

    const result = await copyCategories(sourceCourseId, targetCourseId);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: "Sao chép danh mục thành công",
      created: result.created,
      skipped: result.skipped,
    });
  } catch (err) {
    console.error("❌ Lỗi sao chép danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

module.exports = router;
