// services/lessonService.js
// Business logic cho quản lý bài học (lessons + subLessons)
const { getDB } = require("../config/mongodb");

/* -------------------- Helper: Get Next Lesson ID (Atomic) -------------------- */
async function getNextLessonId() {
  const db = getDB();
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: "lesson_id" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  return `BAI_${result.seq}`;
}

/* -------------------- Helper: Get Next SubLesson ID (Atomic) -------------------- */
async function getNextSubLessonId(parentLessonId) {
  const db = getDB();
  const counterId = `sublesson_${parentLessonId}`;
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  return `${parentLessonId}_${result.seq}`;
}

/**
 * Lấy lessons theo courseId
 * @param {string} courseId
 * @returns {Promise<Array>}
 */
async function getLessonsByCourse(courseId) {
  const db = getDB();
  return db
    .collection("lessons")
    .find({ courseId })
    .sort({ order: 1 })
    .toArray();
}

/**
 * Lấy 1 lesson
 * @param {string} lessonId
 * @param {string} [courseId]
 * @returns {Promise<Object|null>}
 */
async function getLesson(lessonId, courseId) {
  const db = getDB();
  const query = { lessonId };
  if (courseId) query.courseId = courseId;
  return db.collection("lessons").findOne(query);
}

/**
 * Lấy chi tiết bài học (bài lớn hoặc subLesson), kèm questionCount
 * @param {string} lessonId
 * @param {string} [courseId]
 * @returns {Promise<Object|null>}
 */
async function getLessonDetail(lessonId, courseId) {
  const db = getDB();

  // 1) Thử tìm bài lớn
  const query = { lessonId };
  if (courseId) query.courseId = courseId;

  const main = await db.collection("lessons").findOne(query);

  if (main) {
    if (Array.isArray(main.subLessons)) {
      for (const sub of main.subLessons) {
        const qQuery = { lessonId: sub.lessonId };
        if (main.courseId) qQuery.courseId = main.courseId;
        const count = await db.collection("question").countDocuments(qQuery);
        sub.questionCount = count;
      }
    }
    return main;
  }

  // 2) Thử tìm subLesson
  const parentQuery = { "subLessons.lessonId": lessonId };
  if (courseId) parentQuery.courseId = courseId;

  const parent = await db.collection("lessons").findOne(parentQuery);
  if (!parent) return null;

  const sub = parent.subLessons.find((s) => s.lessonId === lessonId);

  // Đếm câu hỏi cho subLesson
  const qQuerySub = { lessonId: sub.lessonId };
  if (parent.courseId) qQuerySub.courseId = parent.courseId;
  const count = await db.collection("question").countDocuments(qQuerySub);

  sub.questionCount = count;
  sub.parentLesson = {
    lessonId: parent.lessonId,
    title: parent.title,
  };
  // Fallback lessonNumber từ parent
  if (sub.lessonNumber === undefined || sub.lessonNumber === null) {
    sub.lessonNumber = parent.lessonNumber;
  }

  return sub;
}

/**
 * Tạo lesson mới
 * @param {Object} data - Dữ liệu lesson (phải có lessonNumber)
 * @returns {Promise<string>} lessonId mới
 */
async function createLesson(data) {
  const db = getDB();
  const lessonId = await getNextLessonId();
  const num = Number(data.lessonNumber);
  const lessonData = { ...data, lessonNumber: num, lessonId };
  delete lessonData._id;
  await db.collection("lessons").insertOne(lessonData);
  return lessonId;
}

/**
 * Cập nhật lesson
 * @param {string} lessonId
 * @param {Object} data
 * @param {string} [courseId]
 * @returns {Promise<{ matchedCount: number, modifiedCount: number }>}
 */
async function updateLesson(lessonId, data, courseId) {
  const db = getDB();
  const updateData = { ...data };
  delete updateData._id;

  const query = { lessonId };
  if (courseId) query.courseId = courseId;

  const result = await db
    .collection("lessons")
    .updateOne(query, { $set: updateData });

  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
}

/**
 * Xóa lesson
 * @param {string} lessonId
 * @param {string} [courseId]
 * @returns {Promise<number>} deletedCount
 */
async function deleteLesson(lessonId, courseId) {
  const db = getDB();
  const query = { lessonId };
  if (courseId) query.courseId = courseId;
  const result = await db.collection("lessons").deleteOne(query);
  return result.deletedCount;
}

/**
 * Sắp xếp lại thứ tự lessons
 * @param {string} courseId
 * @param {Array<string>} lessonIds
 * @returns {Promise<number>} Số operations
 */
async function reorderLessons(courseId, lessonIds) {
  const db = getDB();
  const bulkOps = lessonIds.map((lessonId, index) => ({
    updateOne: {
      filter: { lessonId, courseId },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await db.collection("lessons").bulkWrite(bulkOps);
  }

  return bulkOps.length;
}

// ===================== SubLesson functions =====================

/**
 * Lấy subLessons của 1 lesson
 * @param {string} lessonId - ID lesson cha
 * @param {string} [courseId]
 * @returns {Promise<Array>}
 */
async function getSubLessons(lessonId, courseId) {
  const db = getDB();
  const query = { lessonId };
  if (courseId) query.courseId = courseId;
  const doc = await db.collection("lessons").findOne(query);
  return doc?.subLessons || [];
}

/**
 * Tạo subLesson
 * @param {string} parentLessonId
 * @param {Object} data
 * @param {string} [courseId]
 * @returns {Promise<{ subLessonId: string } | null>}
 */
async function createSubLesson(parentLessonId, data, courseId) {
  const db = getDB();
  const query = { lessonId: parentLessonId };
  if (courseId) query.courseId = courseId;

  // Lấy lesson cha để kế thừa lessonNumber
  const parentLesson = await db.collection("lessons").findOne(query);
  if (!parentLesson) return null;

  const subLessonId = await getNextSubLessonId(parentLessonId);
  const subData = {
    ...data,
    lessonId: subLessonId,
    lessonNumber: parentLesson.lessonNumber,
  };

  await db
    .collection("lessons")
    .updateOne(query, { $push: { subLessons: subData } });

  return { subLessonId };
}

/**
 * Cập nhật subLesson
 * @param {string} parentLessonId
 * @param {string} subId
 * @param {Object} data
 * @param {string} [courseId]
 * @returns {Promise<boolean>} true nếu tìm thấy parent
 */
async function updateSubLesson(parentLessonId, subId, data, courseId) {
  const db = getDB();
  const parentQuery = { lessonId: parentLessonId };
  if (courseId) parentQuery.courseId = courseId;

  const parentLesson = await db.collection("lessons").findOne(parentQuery);
  if (!parentLesson) return false;

  const query = {
    lessonId: parentLessonId,
    "subLessons.lessonId": subId,
  };
  if (courseId) query.courseId = courseId;

  const updateData = {
    ...data,
    lessonNumber: parentLesson.lessonNumber,
  };

  await db
    .collection("lessons")
    .updateOne(query, { $set: { "subLessons.$": updateData } });

  return true;
}

/**
 * Xóa subLesson
 * @param {string} parentLessonId
 * @param {string} subId
 * @param {string} [courseId]
 */
async function deleteSubLesson(parentLessonId, subId, courseId) {
  const db = getDB();
  const query = { lessonId: parentLessonId };
  if (courseId) query.courseId = courseId;

  await db
    .collection("lessons")
    .updateOne(query, {
      $pull: { subLessons: { lessonId: subId } },
    });
}

/**
 * Sắp xếp lại thứ tự subLessons
 * @param {string} lessonId - ID lesson cha
 * @param {Array<string>} subLessonIds
 * @param {string} [courseId]
 * @returns {Promise<number|null>} Số subLessons sau khi sắp, null nếu không tìm thấy lesson
 */
async function reorderSubLessons(lessonId, subLessonIds, courseId) {
  const db = getDB();
  const query = { lessonId };
  if (courseId) query.courseId = courseId;

  const lesson = await db.collection("lessons").findOne(query);
  if (!lesson) return null;

  // Tạo map tra cứu nhanh
  const subMap = {};
  for (const sub of lesson.subLessons || []) {
    subMap[sub.lessonId] = sub;
  }

  // Sắp xếp lại theo thứ tự mới
  const reorderedSubs = subLessonIds
    .map((id, index) => {
      const sub = subMap[id];
      if (sub) return { ...sub, order: index };
      return null;
    })
    .filter(Boolean);

  // Thêm các subLessons không có trong mảng vào cuối
  const existingIds = new Set(subLessonIds);
  let nextOrder = reorderedSubs.length;
  for (const sub of lesson.subLessons || []) {
    if (!existingIds.has(sub.lessonId)) {
      reorderedSubs.push({ ...sub, order: nextOrder++ });
    }
  }

  await db.collection("lessons").updateOne(query, {
    $set: { subLessons: reorderedSubs },
  });

  return reorderedSubs.length;
}

module.exports = {
  getNextLessonId,
  getNextSubLessonId,
  getLessonsByCourse,
  getLesson,
  getLessonDetail,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  getSubLessons,
  createSubLesson,
  updateSubLesson,
  deleteSubLesson,
  reorderSubLessons,
};
