// services/progressService.js
// Business logic cho truy vấn tiến độ học tập
const { getDB } = require("../config/mongodb");

/**
 * Lấy tiến độ subLesson của 1 user
 * @param {string} userId
 * @param {string} subLessonId
 * @returns {Promise<{ progress: number, completed: boolean }>}
 */
async function getSubLessonProgress(userId, subLessonId) {
  const db = getDB();
  const doc = await db
    .collection("sublesson_progress")
    .findOne({ userId, subLessonId });

  if (!doc) return { progress: 0, completed: false };

  return {
    progress: doc.progress || 0,
    completed: !!doc.completed,
  };
}

module.exports = {
  getSubLessonProgress,
};
