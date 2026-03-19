// routes/categoryRoutes.js
// CRUD danh mục (categories) cho ngân hàng câu hỏi
const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const { requireCourseAccess, requireAdmin } = require("../middleware/coursePermission");

// Tất cả routes đều yêu cầu auth
router.use(authMiddleware);

/* ------------ GET / - Lấy danh mục theo courseId ------------ */
router.get("/", async (req, res) => {
  try {
    const { courseId } = req.query;
    const db = getDB();

    // courseId = "null" hoặc không có -> lấy danh mục global
    const filter =
      !courseId || courseId === "null"
        ? { courseId: null }
        : { courseId: courseId };

    const categories = await db
      .collection("categories")
      .find(filter)
      .sort({ order: 1 })
      .toArray();

    res.json({ categories });
  } catch (err) {
    console.error("❌ Lỗi lấy danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ GET /by-course/:courseId - Lấy danh mục của 1 khóa cụ thể ------------ */
router.get("/by-course/:courseId", async (req, res) => {
  try {
    const db = getDB();

    const categories = await db
      .collection("categories")
      .find({ courseId: req.params.courseId })
      .sort({ order: 1 })
      .toArray();

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
    const db = getDB();

    // Validate: name không rỗng
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "Tên danh mục không được để trống" });
    }

    // Xác định courseId: null cho global, string cho khóa
    const normalizedCourseId =
      !courseId || courseId === "null" ? null : courseId;

    // Tính order = max(order trong cùng courseId) + 1
    const maxOrderDoc = await db
      .collection("categories")
      .find({ courseId: normalizedCourseId })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const nextOrder = maxOrderDoc.length > 0 ? maxOrderDoc[0].order + 1 : 0;

    const newCategory = {
      courseId: normalizedCourseId,
      name: name.trim(),
      description: description || "",
      order: nextOrder,
      createdAt: new Date(),
    };

    const result = await db.collection("categories").insertOne(newCategory);
    newCategory._id = result.insertedId;

    res.status(201).json({
      message: "Tạo danh mục thành công",
      category: newCategory,
    });
  } catch (err) {
    // Bắt lỗi duplicate key (unique index: courseId + name)
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
    const db = getDB();
    const categoryId = req.params.id;

    // Tìm category theo _id
    const category = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(categoryId) });

    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    // Validate quyền: global -> chỉ admin, course -> admin/teacher khóa đó
    const { role, id } = req.user;
    if (category.courseId === null) {
      if (role !== "admin") {
        return res
          .status(403)
          .json({ message: "Chỉ admin mới có quyền này" });
      }
    } else if (role !== "admin") {
      if (role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Không có quyền thực hiện thao tác này" });
      }
      // Kiểm tra teacher có dạy khóa này không
      const user = await db
        .collection("users")
        .findOne(
          { _id: new ObjectId(id) },
          { projection: { teachingCourses: 1 } }
        );
      const teachingCourses = (user?.teachingCourses || []).map(id => id.toString());
      if (!teachingCourses.includes(category.courseId.toString())) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền trên khóa học này" });
      }
    }

    // Build update object
    const { name, description, order } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description;
    if (order !== undefined) updateFields.order = order;

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ message: "Không có trường nào để cập nhật" });
    }

    // Nếu đổi tên -> check trùng tên trong cùng courseId
    if (updateFields.name && updateFields.name !== category.name) {
      const duplicate = await db.collection("categories").findOne({
        courseId: category.courseId,
        name: updateFields.name,
        _id: { $ne: new ObjectId(categoryId) },
      });
      if (duplicate) {
        return res
          .status(400)
          .json({ message: "Danh mục đã tồn tại trong khóa này" });
      }
    }

    await db
      .collection("categories")
      .updateOne({ _id: new ObjectId(categoryId) }, { $set: updateFields });

    res.json({ message: "Cập nhật danh mục thành công" });
  } catch (err) {
    console.error("❌ Lỗi cập nhật danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/* ------------ DELETE /:id - Xóa danh mục ------------ */
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const categoryId = req.params.id;

    // Tìm category
    const category = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(categoryId) });

    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    // Validate quyền
    const { role, id } = req.user;
    if (category.courseId === null) {
      if (role !== "admin") {
        return res
          .status(403)
          .json({ message: "Chỉ admin mới có quyền này" });
      }
    } else if (role !== "admin") {
      if (role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Không có quyền thực hiện thao tác này" });
      }
      const user = await db
        .collection("users")
        .findOne(
          { _id: new ObjectId(id) },
          { projection: { teachingCourses: 1 } }
        );
      const teachingCourses = (user?.teachingCourses || []).map(id => id.toString());
      if (!teachingCourses.includes(category.courseId.toString())) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền trên khóa học này" });
      }
    }

    // Kiểm tra có câu hỏi BANK nào dùng danh mục này không
    const bankQuestionCount = await db
      .collection("question")
      .countDocuments({
        categoryId: new ObjectId(categoryId),
        isBank: true,
      });

    if (bankQuestionCount > 0) {
      return res.status(400).json({
        message: `Danh mục đang có ${bankQuestionCount} câu hỏi trong ngân hàng, không thể xóa. Hãy chuyển câu hỏi sang danh mục khác trước.`,
      });
    }

    // Gỡ categoryId trên các câu hỏi bài học (isBank=false) đang tham chiếu
    await db.collection("question").updateMany(
      { categoryId: new ObjectId(categoryId), isBank: false },
      { $set: { categoryId: null } }
    );

    await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(categoryId) });

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
    const db = getDB();

    // Validate quyền đọc khóa nguồn
    const { role, id } = req.user;
    if (role !== "admin") {
      if (!sourceCourseId || sourceCourseId === "null") {
        // Chỉ admin mới có thể copy từ global
        return res.status(403).json({ message: "Chỉ admin mới có quyền sao chép từ Ngân hàng chung" });
      } else {
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

    // Validate: source !== target
    if (sourceCourseId === targetCourseId) {
      return res
        .status(400)
        .json({ message: "Khóa nguồn và khóa đích không được trùng nhau" });
    }

    // Normalize sourceCourseId (null cho global)
    const normalizedSource =
      !sourceCourseId || sourceCourseId === "null" ? null : sourceCourseId;

    // Lấy danh mục nguồn
    const sourceCategories = await db
      .collection("categories")
      .find({ courseId: normalizedSource })
      .sort({ order: 1 })
      .toArray();

    if (sourceCategories.length === 0) {
      return res
        .status(400)
        .json({ message: "Khóa nguồn không có danh mục nào" });
    }

    // Lấy danh mục đích hiện có (để check trùng tên)
    const existingNames = await db
      .collection("categories")
      .find({ courseId: targetCourseId })
      .project({ name: 1 })
      .toArray();

    const existingNameSet = new Set(existingNames.map((c) => c.name));

    // Tính max order hiện tại của target
    const maxOrderDoc = await db
      .collection("categories")
      .find({ courseId: targetCourseId })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    let nextOrder = maxOrderDoc.length > 0 ? maxOrderDoc[0].order + 1 : 0;

    const toInsert = [];
    let skipped = 0;

    for (const cat of sourceCategories) {
      if (existingNameSet.has(cat.name)) {
        skipped++;
        continue;
      }
      toInsert.push({
        courseId: targetCourseId,
        name: cat.name,
        description: cat.description || "",
        order: nextOrder++,
        createdAt: new Date(),
      });
    }

    if (toInsert.length > 0) {
      await db.collection("categories").insertMany(toInsert);
    }

    res.json({
      message: "Sao chép danh mục thành công",
      created: toInsert.length,
      skipped: skipped,
    });
  } catch (err) {
    console.error("❌ Lỗi sao chép danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

module.exports = router;
