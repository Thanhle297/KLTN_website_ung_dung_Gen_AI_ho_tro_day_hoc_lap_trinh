// services/csvService.js
// Business logic cho import/export CSV
const { getDB } = require("../config/mongodb");
const { getCourseStructure, getProgressMap } = require("./courseService");

/**
 * Import enrollments từ CSV content
 * @param {string} csvContent
 * @returns {Promise<{ success: number, errors: number, errorDetails: Array }>}
 */
async function importEnrollments(csvContent) {
  const db = getDB();
  const lines = csvContent.split("\n").filter((line) => line.trim());
  const dataLines = lines.slice(1); // Bỏ header

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
      const user = await db.collection("users").findOne({ username });
      if (!user) {
        errorCount++;
        errors.push(`Không tìm thấy user: ${username}`);
        continue;
      }

      if (user.role === "teacher") {
        errorCount++;
        errors.push(`${username} là giáo viên, không thể enroll. Hãy dùng chức năng phân công giáo viên`);
        continue;
      }

      const course = await db.collection("courses").findOne({ courseId });
      if (!course) {
        errorCount++;
        errors.push(`Không tìm thấy khóa học: ${courseId}`);
        continue;
      }

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

  return {
    success: successCount,
    errors: errorCount,
    errorDetails: errors.slice(0, 10),
  };
}

/**
 * Export enrollments ra CSV string
 * @returns {Promise<string>}
 */
async function exportEnrollments() {
  const db = getDB();

  const users = await db
    .collection("users")
    .find({
      role: "user",
      enrolledCourses: { $exists: true, $ne: [] },
    })
    .toArray();

  let csvContent = "username,courseId\n";

  for (const user of users) {
    for (const courseId of user.enrolledCourses || []) {
      csvContent += `${user.username},${courseId}\n`;
    }
  }

  return csvContent;
}

/**
 * Export điểm học sinh theo khóa học ra CSV string
 * @param {string} courseId
 * @returns {Promise<{ csvContent: string, filename: string } | null>}
 */
async function exportScores(courseId) {
  const db = getDB();

  const course = await db.collection("courses").findOne({ courseId });
  if (!course) return null;

  // Lấy students
  const students = await db
    .collection("users")
    .find({ enrolledCourses: courseId, role: "user" })
    .project({ _id: 1, username: 1, fullname: 1 })
    .toArray();

  // Lấy cấu trúc bài học (dùng chung từ courseService)
  const structure = await getCourseStructure(courseId);

  // Lấy progress map (dùng chung từ courseService)
  const studentIds = students.map((s) => s._id.toString());
  const progressMap = await getProgressMap(studentIds, courseId);

  // Tạo CSV headers
  const headers = ["MSSV", "Ho ten"];
  for (const sub of structure) {
    const colName = `${sub.lessonTitle} - ${sub.subLessonTitle}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    headers.push(colName);
  }
  headers.push("Trung binh (%)");

  let csvContent = headers.join(",") + "\n";

  // Sắp xếp học sinh theo tên
  students.sort((a, b) =>
    (a.fullname || a.username).localeCompare(b.fullname || b.username, "vi")
  );

  for (const student of students) {
    const row = [];

    row.push(student.username);

    const fullname = (student.fullname || student.username)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    row.push(`"${fullname}"`);

    let totalProgress = 0;
    for (const sub of structure) {
      const key = `${student._id.toString()}_${sub.subLessonId}`;
      const progressDoc = progressMap[key];
      const progress = progressDoc?.progress || 0;
      row.push(progress);
      totalProgress += progress;
    }

    const average = structure.length > 0
      ? Math.round(totalProgress / structure.length)
      : 0;
    row.push(average);

    csvContent += row.join(",") + "\n";
  }

  // Tạo tên file
  const courseName = course.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Diem_${courseName}_${timestamp}.csv`;

  return { csvContent, filename };
}

module.exports = {
  importEnrollments,
  exportEnrollments,
  exportScores,
};
