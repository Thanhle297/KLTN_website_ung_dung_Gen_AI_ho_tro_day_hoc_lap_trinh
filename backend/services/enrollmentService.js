// services/enrollmentService.js
// Business logic cho phân bổ học sinh vào khóa học
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

/**
 * Phân bổ 1 user vào 1 course
 * @param {string} userId
 * @param {string} courseId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function enrollUser(userId, courseId) {
  const db = getDB();

  // Kiểm tra user tồn tại
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return { success: false, status: 404, message: "Không tìm thấy user" };
  }

  // Chỉ cho phép enroll students, teacher dùng teachingCourses
  if (user.role === "teacher") {
    return {
      success: false,
      status: 400,
      message: "Không thể enroll giáo viên. Hãy dùng chức năng phân công giáo viên",
    };
  }

  // Kiểm tra course tồn tại
  const course = await db.collection("courses").findOne({ courseId });
  if (!course) {
    return { success: false, status: 404, message: "Không tìm thấy khóa học" };
  }

  // Thêm courseId vào enrolledCourses (không trùng lặp)
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $addToSet: { enrolledCourses: courseId },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true, message: "Phân bổ thành công" };
}

/**
 * Gỡ 1 user khỏi 1 course
 * @param {string} userId
 * @param {string} courseId
 */
async function unenrollUser(userId, courseId) {
  const db = getDB();
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: { enrolledCourses: courseId },
      $set: { updatedAt: new Date() },
    }
  );
}

/**
 * Phân bổ nhiều user vào nhiều courses
 * @param {Array<string>} userIds
 * @param {Array<string>} courseIds
 * @returns {Promise<{ users: number, courses: number, total: number }>}
 */
async function bulkEnroll(userIds, courseIds) {
  const db = getDB();

  const updatePromises = userIds.map((userId) =>
    db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $addToSet: { enrolledCourses: { $each: courseIds } },
        $set: { updatedAt: new Date() },
      }
    )
  );

  await Promise.all(updatePromises);

  return {
    users: userIds.length,
    courses: courseIds.length,
    total: userIds.length * courseIds.length,
  };
}

/**
 * Lấy danh sách user (students) trong 1 course
 * @param {string} courseId
 * @returns {Promise<Array>}
 */
async function getCourseUsers(courseId) {
  const db = getDB();
  return db
    .collection("users")
    .find({
      enrolledCourses: courseId,
      role: "user",
    })
    .project({ password: 0 })
    .sort({ fullname: 1 })
    .toArray();
}

/**
 * Lấy danh sách courses của 1 user
 * @param {string} userId
 * @returns {Promise<{ user: Object|null, courses: Array }>}
 */
async function getUserCourses(userId) {
  const db = getDB();

  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId) });

  if (!user) return { user: null, courses: [] };

  const enrolledCourses = user.role === "teacher"
    ? (user.teachingCourses || [])
    : (user.enrolledCourses || []);

  const courses = await db
    .collection("courses")
    .find({ courseId: { $in: enrolledCourses } })
    .toArray();

  return { user, courses };
}

module.exports = {
  enrollUser,
  unenrollUser,
  bulkEnroll,
  getCourseUsers,
  getUserCourses,
};
