// services/submitService.js
// Business logic cho việc nộp bài, tính điểm, lưu lịch sử
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

/**
 * Tính điểm dựa trên editorStates
 * Hỗ trợ 3 mức: correct=1đ, partial=0.5đ, wrong=0đ
 * @param {Object} editorStates - Trạng thái các câu hỏi
 * @returns {{ correct, partial, wrong, total, progress }}
 */
function calculateScore(editorStates) {
  const states = Object.values(editorStates || {});
  const total = states.length;
  const correct = states.filter((s) => s.status === "correct").length;
  const partial = states.filter((s) => s.status === "partial").length;
  const wrong = total - correct - partial;
  const progress =
    total > 0
      ? Math.round(((correct * 1 + partial * 0.5) / total) * 100)
      : 0;
  return { correct, partial, wrong, total, progress };
}

/**
 * Lấy requiredProgress từ lessons.subLessons[]
 * @param {string} lessonId - ID của subLesson
 * @returns {Promise<number>} requiredProgress (mặc định 70)
 */
async function getRequiredProgress(lessonId) {
  const db = getDB();
  const lessonDoc = await db
    .collection("lessons")
    .findOne(
      { "subLessons.lessonId": lessonId },
      { projection: { subLessons: 1 } }
    );

  const subLesson = lessonDoc?.subLessons?.find(
    (s) => s.lessonId === lessonId
  );

  return subLesson?.requiredProgress ?? 70;
}

/**
 * Lấy snapshot câu hỏi hiện tại
 * @param {string} lessonId
 * @param {string} [courseId]
 * @returns {Promise<Array>}
 */
async function getQuestionsSnapshot(lessonId, courseId) {
  const db = getDB();
  const query = { lessonId };
  if (courseId) query.courseId = courseId;
  return db.collection("question").find(query).toArray();
}

/**
 * Nộp bài và lưu tiến độ
 * Orchestrate toàn bộ flow: tính điểm → lấy requiredProgress → lưu history → update best progress
 * @param {{ userId: string, lessonId: string, courseId: string, editorStates: Object }} params
 * @returns {Promise<Object>} Kết quả nộp bài
 */
async function submitAndSaveProgress({ userId, lessonId, courseId, editorStates }) {
  const db = getDB();

  // 1. Tính điểm
  const { correct, partial, wrong, total, progress } = calculateScore(editorStates);

  // 2. Lấy requiredProgress
  const requiredProgress = await getRequiredProgress(lessonId);
  const completed = progress >= requiredProgress;

  // 3. Lấy snapshot câu hỏi
  const questionsSnapshot = await getQuestionsSnapshot(lessonId, courseId);

  // 4. Lưu lịch sử (không ghi đè)
  const insertResult = await db.collection("submit_history").insertOne({
    userId,
    lessonId, // chính là subLessonId
    courseId,
    correct,
    partial,
    wrong,
    total,
    progress,
    requiredProgress,
    editorStates,
    questions: questionsSnapshot,
    createdAt: new Date(),
  });

  const submissionId = insertResult.insertedId.toString();

  // 5. Lưu best result vào sublesson_progress
  const old = await db.collection("sublesson_progress").findOne({
    userId,
    subLessonId: lessonId,
  });

  if (!old || progress > old.progress) {
    await db.collection("sublesson_progress").updateOne(
      { userId, subLessonId: lessonId },
      {
        $set: {
          userId,
          subLessonId: lessonId,
          courseId,
          progress,
          requiredProgress,
          completed,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  return {
    correct,
    partial,
    wrong,
    total,
    progress,
    requiredProgress,
    completed,
    submissionId,
    bestProgress: old ? Math.max(progress, old.progress) : progress,
    improved: !old || progress > old.progress,
  };
}

/**
 * Lấy lịch sử nộp bài của user cho 1 subLesson
 * @param {string} userId
 * @param {string} subLessonId
 * @returns {Promise<Array>}
 */
async function getHistory(userId, subLessonId) {
  const db = getDB();
  return db
    .collection("submit_history")
    .find(
      { userId, lessonId: subLessonId },
      {
        projection: {
          _id: 1,
          createdAt: 1,
          progress: 1,
          correct: 1,
          total: 1,
          requiredProgress: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Lấy chi tiết 1 bài nộp
 * @param {string} submissionId
 * @returns {Promise<Object|null>}
 */
async function getSubmissionDetail(submissionId) {
  const db = getDB();
  return db
    .collection("submit_history")
    .findOne({ _id: new ObjectId(submissionId) });
}

module.exports = {
  calculateScore,
  getRequiredProgress,
  getQuestionsSnapshot,
  submitAndSaveProgress,
  getHistory,
  getSubmissionDetail,
};
