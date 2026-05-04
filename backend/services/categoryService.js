// services/categoryService.js
// Business logic cho quản lý danh mục câu hỏi
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

const categoryNameCollator = new Intl.Collator("vi", {
  numeric: true,
  sensitivity: "base",
});

function sortCategoriesByName(categories) {
  return categories.sort((a, b) => {
    const nameCompare = categoryNameCollator.compare(
      a.name || "",
      b.name || ""
    );
    if (nameCompare !== 0) return nameCompare;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

/**
 * Lấy danh mục theo courseId
 * @param {string|null} courseId - null hoặc "null" cho global
 * @returns {Promise<Array>}
 */
async function getCategories(courseId) {
  const db = getDB();
  const filter = !courseId || courseId === "null"
    ? { courseId: null }
    : { courseId };

  const categories = await db
    .collection("categories")
    .find(filter)
    .toArray();

  return sortCategoriesByName(categories);
}

/**
 * Lấy danh mục theo courseId (alias cho route /by-course/:courseId)
 * @param {string} courseId
 * @returns {Promise<Array>}
 */
async function getCategoriesByCourse(courseId) {
  const db = getDB();
  const categories = await db
    .collection("categories")
    .find({ courseId })
    .toArray();

  return sortCategoriesByName(categories);
}

/**
 * Tạo danh mục mới
 * @param {{ courseId: string|null, name: string, description?: string }} data
 * @returns {Promise<Object>} category document mới
 */
async function createCategory({ courseId, name, description }) {
  const db = getDB();
  const normalizedCourseId = !courseId || courseId === "null" ? null : courseId;

  // Tính order
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
  return newCategory;
}

/**
 * Lấy 1 category theo ID
 * @param {string} categoryId
 * @returns {Promise<Object|null>}
 */
async function getCategoryById(categoryId) {
  const db = getDB();
  return db.collection("categories").findOne({ _id: new ObjectId(categoryId) });
}

/**
 * Cập nhật danh mục
 * @param {string} categoryId
 * @param {{ name?: string, description?: string, order?: number }} data
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function updateCategory(categoryId, data, category) {
  const db = getDB();
  const { name, description, order } = data;
  const updateFields = {};

  if (name !== undefined) updateFields.name = name.trim();
  if (description !== undefined) updateFields.description = description;
  if (order !== undefined) updateFields.order = order;

  if (Object.keys(updateFields).length === 0) {
    return { success: false, error: "Không có trường nào để cập nhật" };
  }

  // Check trùng tên trong cùng courseId
  if (updateFields.name && updateFields.name !== category.name) {
    const duplicate = await db.collection("categories").findOne({
      courseId: category.courseId,
      name: updateFields.name,
      _id: { $ne: new ObjectId(categoryId) },
    });
    if (duplicate) {
      return { success: false, error: "Danh mục đã tồn tại trong khóa này" };
    }
  }

  await db
    .collection("categories")
    .updateOne({ _id: new ObjectId(categoryId) }, { $set: updateFields });

  return { success: true };
}

/**
 * Xóa danh mục (kiểm tra có câu hỏi bank nào đang dùng không)
 * @param {string} categoryId
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function deleteCategory(categoryId) {
  const db = getDB();

  // Kiểm tra có câu hỏi BANK nào dùng danh mục này không
  const bankQuestionCount = await db
    .collection("question")
    .countDocuments({
      categoryId: new ObjectId(categoryId),
      isBank: true,
    });

  if (bankQuestionCount > 0) {
    return {
      success: false,
      error: `Danh mục đang có ${bankQuestionCount} câu hỏi trong ngân hàng, không thể xóa. Hãy chuyển câu hỏi sang danh mục khác trước.`,
    };
  }

  // Gỡ categoryId trên các câu hỏi bài học đang tham chiếu
  await db.collection("question").updateMany(
    { categoryId: new ObjectId(categoryId), isBank: false },
    { $set: { categoryId: null } }
  );

  await db
    .collection("categories")
    .deleteOne({ _id: new ObjectId(categoryId) });

  return { success: true };
}

/**
 * Kiểm tra quyền category (dùng cho PUT/DELETE)
 * @param {Object} category - Category document
 * @param {Object} user - { role, id }
 * @returns {Promise<{ allowed: boolean, message?: string }>}
 */
async function checkCategoryPermission(category, user) {
  const db = getDB();
  const { role, id } = user;

  // Global category → chỉ admin
  if (category.courseId === null) {
    if (role !== "admin") {
      return { allowed: false, message: "Chỉ admin mới có quyền này" };
    }
    return { allowed: true };
  }

  // Admin luôn được
  if (role === "admin") return { allowed: true };

  // Teacher: kiểm tra có dạy khóa này không
  if (role === "teacher") {
    const userDoc = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { teachingCourses: 1 } }
      );
    const teachingCourses = (userDoc?.teachingCourses || []).map(cid => cid.toString());
    if (teachingCourses.includes(category.courseId.toString())) {
      return { allowed: true };
    }
    return { allowed: false, message: "Bạn không có quyền trên khóa học này" };
  }

  return { allowed: false, message: "Không có quyền thực hiện thao tác này" };
}

/**
 * Sao chép danh mục giữa khóa
 * @param {string|null} sourceCourseId
 * @param {string} targetCourseId
 * @returns {Promise<{ created: number, skipped: number }>}
 */
async function copyCategories(sourceCourseId, targetCourseId) {
  const db = getDB();

  const normalizedSource = !sourceCourseId || sourceCourseId === "null"
    ? null
    : sourceCourseId;

  const sourceCategories = await db
    .collection("categories")
    .find({ courseId: normalizedSource })
    .toArray();

  sortCategoriesByName(sourceCategories);

  if (sourceCategories.length === 0) {
    return { created: 0, skipped: 0, error: "Khóa nguồn không có danh mục nào" };
  }

  // Check trùng tên
  const existingNames = await db
    .collection("categories")
    .find({ courseId: targetCourseId })
    .project({ name: 1 })
    .toArray();

  const existingNameSet = new Set(existingNames.map((c) => c.name));

  // Tính max order
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

  return { created: toInsert.length, skipped };
}

module.exports = {
  getCategories,
  getCategoriesByCourse,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  checkCategoryPermission,
  copyCategories,
};
