// services/questionService.js
// Business logic cho quản lý câu hỏi và ngân hàng đề
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

/* -------------------- Helper: Get Next Question ID (Atomic) -------------------- */
async function getNextQuestionId() {
  const db = getDB();
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: "question_id" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  return result.seq;
}

/* -------------------- Helper: Strip HTML tags -------------------- */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------- Helper: Tìm hoặc tạo category -------------------- */
async function findOrCreateCategory(courseId, categoryName) {
  if (!categoryName) return null;
  const db = getDB();

  const existing = await db.collection("categories").findOne({
    courseId: courseId,
    name: categoryName,
  });

  if (existing) return existing._id;

  // Tạo mới
  const maxOrder = await db
    .collection("categories")
    .find({ courseId })
    .sort({ order: -1 })
    .limit(1)
    .toArray();
  const order = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;

  const result = await db.collection("categories").insertOne({
    courseId,
    name: categoryName,
    description: "",
    order,
    createdAt: new Date(),
  });
  return result.insertedId;
}

/**
 * Lấy danh sách câu hỏi theo filter
 * @param {Object} queryParams - { lessonId, isBank, category, courseId, categoryId }
 * @returns {Promise<Array>}
 */
async function getQuestions(queryParams) {
  const db = getDB();
  const { lessonId, isBank, category, courseId, categoryId } = queryParams;
  const query = {};

  if (lessonId) query.lessonId = lessonId;

  if (courseId === "null") {
    query.courseId = null;
  } else if (courseId) {
    query.courseId = courseId;
  }

  if (isBank === "true") query.isBank = true;
  if (category) query.category = { $regex: category, $options: "i" };
  if (categoryId) query.categoryId = new ObjectId(categoryId);

  return db.collection("question").find(query).sort({ id: 1 }).toArray();
}

/**
 * Lấy 1 câu hỏi theo id
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function getQuestionById(id) {
  const db = getDB();
  return db.collection("question").findOne({ id: Number(id) });
}

/**
 * Tạo câu hỏi mới
 * @param {Object} data
 * @returns {Promise<number>} id mới
 */
async function createQuestion(data) {
  const db = getDB();
  const newId = await getNextQuestionId();
  const questionData = { ...data, id: newId };

  // Convert categoryId string → ObjectId + auto-sync category name
  if (questionData.categoryId) {
    questionData.categoryId = new ObjectId(questionData.categoryId);
    if (!questionData.category) {
      const cat = await db.collection("categories").findOne({ _id: questionData.categoryId });
      if (cat) questionData.category = cat.name;
    }
  }

  await db.collection("question").insertOne(questionData);
  return newId;
}

/**
 * Cập nhật câu hỏi
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<number>} matchedCount
 */
async function updateQuestion(id, data) {
  const db = getDB();
  const updateData = { ...data };
  delete updateData._id;
  delete updateData.id;

  // Convert categoryId → ObjectId + sync category name
  if (updateData.categoryId) {
    updateData.categoryId = new ObjectId(updateData.categoryId);
    const cat = await db.collection("categories").findOne({ _id: updateData.categoryId });
    if (cat) updateData.category = cat.name;
  }

  const result = await db
    .collection("question")
    .updateOne({ id: Number(id) }, { $set: updateData });
  return result.matchedCount;
}

/**
 * Xóa câu hỏi
 * @param {number} id
 */
async function deleteQuestion(id) {
  const db = getDB();
  await db.collection("question").deleteOne({ id: Number(id) });
}

/**
 * Sắp xếp lại thứ tự câu hỏi
 * @param {Array<number>} questionIds
 * @returns {Promise<number>}
 */
async function reorderQuestions(questionIds) {
  const db = getDB();
  const bulkOps = questionIds.map((qId, index) => ({
    updateOne: {
      filter: { id: Number(qId) },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await db.collection("question").bulkWrite(bulkOps);
  }
  return bulkOps.length;
}

/**
 * Assign (Clone từ Bank vào Lesson)
 * @param {Array<number>} questionIds
 * @param {string} targetLessonId
 * @param {string} courseId
 * @returns {Promise<{ count: number, error?: string }>}
 */
async function assignQuestions(questionIds, targetLessonId, courseId) {
  const db = getDB();

  const sources = await db
    .collection("question")
    .find({ id: { $in: questionIds } })
    .toArray();

  if (!sources.length) return { count: 0 };

  // Validate cross-course
  for (const q of sources) {
    if (q.courseId && q.courseId !== courseId) {
      return {
        count: 0,
        error: `Câu hỏi #${q.id} thuộc khóa ${q.courseId}, không thể gán vào khóa ${courseId}`,
      };
    }
  }

  const newDocs = [];
  for (const q of sources) {
    const newId = await getNextQuestionId();
    const { _id, id, isBank, ...rest } = q;
    newDocs.push({
      ...rest,
      id: newId,
      lessonId: targetLessonId,
      courseId: courseId,
      isBank: false,
    });
  }

  if (newDocs.length) await db.collection("question").insertMany(newDocs);
  return { count: newDocs.length };
}

/**
 * Import: Global Bank → Course Bank
 * @param {Array<number>} questionIds
 * @param {string} targetCourseId
 * @returns {Promise<Object>}
 */
async function importToCourse(questionIds, targetCourseId) {
  const db = getDB();

  const sources = await db
    .collection("question")
    .find({ id: { $in: questionIds }, isBank: true, courseId: null })
    .toArray();

  // Kiểm tra thiếu
  const foundIds = new Set(sources.map((q) => q.id));
  const missing = questionIds.filter((qId) => !foundIds.has(qId));
  if (missing.length > 0) {
    return {
      error: `Không tìm thấy câu hỏi #${missing.join(", #")} trong ngân hàng chung`,
    };
  }

  let categoriesCreated = 0;
  const newDocs = [];

  for (const q of sources) {
    const newId = await getNextQuestionId();
    const { _id, id, isBank, order, ...rest } = q;

    let mappedCategoryId = null;
    if (q.category) {
      const existingCat = await db.collection("categories").findOne({
        courseId: targetCourseId,
        name: q.category,
      });
      if (existingCat) {
        mappedCategoryId = existingCat._id;
      } else {
        mappedCategoryId = await findOrCreateCategory(targetCourseId, q.category);
        categoriesCreated++;
      }
    }

    newDocs.push({
      ...rest,
      id: newId,
      courseId: targetCourseId,
      lessonId: null,
      isBank: true,
      categoryId: mappedCategoryId,
      category: q.category || null,
      order: null,
    });
  }

  if (newDocs.length) {
    await db.collection("question").insertMany(newDocs);
  }

  return {
    imported: newDocs.length,
    categoriesCreated,
    questions: newDocs.map((q) => ({ id: q.id, category: q.category })),
  };
}

/**
 * Copy: Course Bank A → Course Bank B
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function copyBetweenCourses({ questionIds, sourceCourseId, targetCourseId, copyCategories = true }) {
  const db = getDB();

  const sources = await db
    .collection("question")
    .find({ id: { $in: questionIds }, isBank: true, courseId: sourceCourseId })
    .toArray();

  if (!sources.length) {
    return { error: "Không tìm thấy câu hỏi trong khóa nguồn" };
  }

  // Category mapping
  const categoryMap = new Map();
  let categoriesCreated = 0;

  if (copyCategories) {
    const uniqueCatIds = [
      ...new Set(
        sources.filter((q) => q.categoryId).map((q) => q.categoryId.toString())
      ),
    ];

    if (uniqueCatIds.length > 0) {
      const sourceCats = await db
        .collection("categories")
        .find({ _id: { $in: uniqueCatIds.map((id) => new ObjectId(id)) } })
        .toArray();

      for (const srcCat of sourceCats) {
        const targetCat = await db.collection("categories").findOne({
          courseId: targetCourseId,
          name: srcCat.name,
        });

        if (targetCat) {
          categoryMap.set(srcCat._id.toString(), targetCat._id);
        } else {
          const newCatId = await findOrCreateCategory(targetCourseId, srcCat.name);
          categoryMap.set(srcCat._id.toString(), newCatId);
          categoriesCreated++;
        }
      }
    }
  }

  const newDocs = [];
  for (const q of sources) {
    const newId = await getNextQuestionId();
    const { _id, id, isBank, order, ...rest } = q;

    let mappedCategoryId = null;
    if (q.categoryId && categoryMap.has(q.categoryId.toString())) {
      mappedCategoryId = categoryMap.get(q.categoryId.toString());
    }

    newDocs.push({
      ...rest,
      id: newId,
      courseId: targetCourseId,
      isBank: true,
      categoryId: mappedCategoryId,
      order: null,
    });
  }

  if (newDocs.length) await db.collection("question").insertMany(newDocs);

  return { copied: newDocs.length, categoriesCreated };
}

/**
 * Promote: Course Bank → Global Bank
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function promoteToGlobal({ questionIds, sourceCourseId, skipDuplicateCheck = false }) {
  const db = getDB();

  const sources = await db
    .collection("question")
    .find({ id: { $in: questionIds }, isBank: true, courseId: sourceCourseId })
    .toArray();

  if (!sources.length) {
    return { error: "Không tìm thấy câu hỏi trong khóa nguồn" };
  }

  // Duplicate check
  let duplicateMap = new Map();
  if (!skipDuplicateCheck) {
    const globalQuestions = await db
      .collection("question")
      .find({ isBank: true, courseId: null })
      .project({ id: 1, question: 1 })
      .toArray();

    const globalPlainTexts = globalQuestions.map((gq) => ({
      id: gq.id,
      plainText: stripHtml(gq.question),
    }));

    for (const q of sources) {
      const sourcePlain = stripHtml(q.question);
      const match = globalPlainTexts.find(
        (gq) => gq.plainText === sourcePlain && sourcePlain.length > 0
      );
      if (match) {
        duplicateMap.set(q.id, { isDuplicate: true, duplicateOf: match.id });
      }
    }
  }

  const results = [];
  const safeSources = [];

  for (const q of sources) {
    const dupInfo = duplicateMap.get(q.id);
    if (dupInfo && dupInfo.isDuplicate) {
      results.push({
        sourceId: q.id,
        newGlobalId: null,
        status: "duplicate_warning",
        duplicateOf: dupInfo.duplicateOf,
        message: `Nội dung tương tự câu #${dupInfo.duplicateOf} trong ngân hàng chung`,
      });
    } else {
      safeSources.push(q);
    }
  }

  const newDocs = [];
  for (const q of safeSources) {
    const newId = await getNextQuestionId();
    const { _id, id, isBank, order, courseId, ...rest } = q;

    let globalCategoryId = null;
    if (q.category) {
      globalCategoryId = await findOrCreateCategory(null, q.category);
    }

    const doc = {
      ...rest,
      id: newId,
      courseId: null,
      lessonId: null,
      isBank: true,
      categoryId: globalCategoryId,
      category: q.category || null,
      order: null,
    };
    newDocs.push(doc);

    results.push({
      sourceId: q.id,
      newGlobalId: newId,
      status: "created",
    });
  }

  if (newDocs.length) await db.collection("question").insertMany(newDocs);

  return {
    promoted: results,
    totalCreated: newDocs.length,
    totalWarnings: results.filter((r) => r.status === "duplicate_warning").length,
  };
}

module.exports = {
  getNextQuestionId,
  stripHtml,
  findOrCreateCategory,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  assignQuestions,
  importToCourse,
  copyBetweenCourses,
  promoteToGlobal,
};
