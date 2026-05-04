// services/courseService.js
// Business logic cho quản lý khóa học
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

/* -------------------- Helper: Get Next Course ID (Atomic) -------------------- */
async function getNextCourseId() {
  const db = getDB();
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: "course_id" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  return `CRS_${result.seq}`;
}

/**
 * Lấy tất cả courses
 * @returns {Promise<Array>}
 */
async function getAllCourses() {
  const db = getDB();
  return db.collection("courses").find().toArray();
}

/**
 * Lấy courses theo quyền user (admin thấy hết, teacher/student chỉ thấy courses được phân)
 * @param {string} userId
 * @param {string} userRole
 * @returns {Promise<Array>}
 */
async function getMyCourses(userId, userRole) {
  const db = getDB();

  // Admin thấy tất cả courses
  if (userRole === "admin") {
    return db.collection("courses").find().toArray();
  }

  // Lấy user để check enrolled/teaching courses
  const user = await db.collection("users").findOne({
    _id: new ObjectId(userId),
  });

  // Teacher dùng teachingCourses, student dùng enrolledCourses
  const courseIds = userRole === "teacher"
    ? (user?.teachingCourses || [])
    : (user?.enrolledCourses || []);

  return db
    .collection("courses")
    .find({ courseId: { $in: courseIds } })
    .toArray();
}

/**
 * Lấy 1 course theo courseId
 * @param {string} courseId
 * @returns {Promise<Object|null>}
 */
async function getCourseById(courseId) {
  const db = getDB();
  return db.collection("courses").findOne({ courseId });
}

/**
 * Tạo course mới với ID tự động
 * @param {Object} data - Dữ liệu course
 * @returns {Promise<string>} courseId mới
 */
async function createCourse(data) {
  const db = getDB();
  const courseId = await getNextCourseId();
  const courseData = { ...data, courseId };
  delete courseData._id;
  await db.collection("courses").insertOne(courseData);
  return courseId;
}

/**
 * Đồng bộ teachingCourses khi danh sách teacher thay đổi
 * Hàm này xử lý logic chung: thêm courseId vào teachingCourses của teachers mới,
 * xóa courseId khỏi teachingCourses của teachers bị gỡ
 * @param {string} courseId
 * @param {Array<string>} oldTeacherIds - Danh sách teacher cũ
 * @param {Array<string>} newTeacherIds - Danh sách teacher mới
 */
async function syncTeacherCourses(courseId, oldTeacherIds, newTeacherIds) {
  const db = getDB();

  // Giáo viên MỚI được thêm
  const addedTeachers = newTeacherIds.filter(
    (id) => !oldTeacherIds.includes(id),
  );
  if (addedTeachers.length > 0) {
    await db.collection("users").updateMany(
      { _id: { $in: addedTeachers.map((id) => new ObjectId(id)) } },
      {
        $addToSet: { teachingCourses: courseId },
        $set: { updatedAt: new Date() },
      },
    );
  }

  // Giáo viên BỊ XÓA
  const removedTeachers = oldTeacherIds.filter(
    (id) => !newTeacherIds.includes(id),
  );
  if (removedTeachers.length > 0) {
    await db.collection("users").updateMany(
      { _id: { $in: removedTeachers.map((id) => new ObjectId(id)) } },
      {
        $pull: { teachingCourses: courseId },
        $set: { updatedAt: new Date() },
      },
    );
  }
}

/**
 * Cập nhật course, tự động sync teachingCourses nếu teacherIds thay đổi
 * @param {string} courseId
 * @param {Object} updateData
 */
async function updateCourse(courseId, updateData) {
  const db = getDB();

  // Nếu có teacherIds trong body, đồng bộ teachingCourses
  if (Array.isArray(updateData.teacherIds)) {
    const course = await db.collection("courses").findOne({ courseId });
    const oldTeacherIds = course?.teacherIds || [];
    await syncTeacherCourses(courseId, oldTeacherIds, updateData.teacherIds);
  }

  await db.collection("courses").updateOne({ courseId }, { $set: updateData });
}

/**
 * Xóa course và dọn dẹp references trong users
 * @param {string} courseId
 */
async function deleteCourse(courseId) {
  const db = getDB();

  // Xóa course
  await db.collection("courses").deleteOne({ courseId });

  // Xóa courseId khỏi enrolledCourses của students
  await db
    .collection("users")
    .updateMany(
      { enrolledCourses: courseId },
      { $pull: { enrolledCourses: courseId } },
    );

  // Xóa courseId khỏi teachingCourses của teachers
  await db
    .collection("users")
    .updateMany(
      { teachingCourses: courseId },
      { $pull: { teachingCourses: courseId } },
    );
}

/**
 * Kiểm tra user có quyền edit khóa học hay không
 * @param {string} courseId
 * @param {string} userId
 * @param {string} userRole
 * @returns {Promise<{ canEdit: boolean, role: string, isTeacherOfCourse?: boolean, message?: string }>}
 */
async function checkCanEdit(courseId, userId, userRole) {
  // Admin luôn có quyền edit
  if (userRole === "admin") {
    return { canEdit: true, role: "admin" };
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return { canEdit: false, role: userRole, message: "Không tìm thấy khóa học" };
  }

  // Teacher: kiểm tra có trong teacherIds không
  if (userRole === "teacher") {
    const teacherIds = course.teacherIds || [];
    const isTeacherOfCourse = teacherIds.includes(userId);
    return { canEdit: isTeacherOfCourse, role: "teacher", isTeacherOfCourse };
  }

  // User thường: không có quyền edit
  return { canEdit: false, role: userRole || "user" };
}

/**
 * Lấy danh sách teachers của course
 * @param {string} courseId
 * @returns {Promise<{ course: Object|null, teachers: Array }>}
 */
async function getCourseTeachers(courseId) {
  const db = getDB();

  const course = await db.collection("courses").findOne({ courseId });
  if (!course) return { course: null, teachers: [] };

  const teacherIds = course.teacherIds || [];

  const teachers = await db
    .collection("users")
    .find(
      { _id: { $in: teacherIds.map((id) => new ObjectId(id)) } },
      { projection: { _id: 1, username: 1, fullname: 1, email: 1, role: 1 } },
    )
    .toArray();

  return { course, teachers };
}

/**
 * Gán danh sách teachers cho khóa học (thay thế toàn bộ)
 * @param {string} courseId
 * @param {Array<string>} teacherIds
 */
async function setTeachers(courseId, teacherIds) {
  const db = getDB();

  const course = await db.collection("courses").findOne({ courseId });
  if (!course) return null;

  const oldTeacherIds = course.teacherIds || [];

  // Cập nhật teacherIds cho course
  await db
    .collection("courses")
    .updateOne({ courseId }, { $set: { teacherIds } });

  // Đồng bộ teachingCourses
  await syncTeacherCourses(courseId, oldTeacherIds, teacherIds);

  return { teacherIds };
}

/**
 * Thêm 1 teacher vào khóa học
 * @param {string} courseId
 * @param {string} teacherId
 */
async function addTeacher(courseId, teacherId) {
  const db = getDB();

  await db
    .collection("courses")
    .updateOne({ courseId }, { $addToSet: { teacherIds: teacherId } });

  await db.collection("users").updateOne(
    { _id: new ObjectId(teacherId) },
    {
      $addToSet: { teachingCourses: courseId },
      $set: { updatedAt: new Date() },
    },
  );
}

/**
 * Xóa 1 teacher khỏi khóa học
 * @param {string} courseId
 * @param {string} teacherId
 */
async function removeTeacher(courseId, teacherId) {
  const db = getDB();

  await db
    .collection("courses")
    .updateOne({ courseId }, { $pull: { teacherIds: teacherId } });

  await db.collection("users").updateOne(
    { _id: new ObjectId(teacherId) },
    {
      $pull: { teachingCourses: courseId },
      $set: { updatedAt: new Date() },
    },
  );
}

/**
 * Lấy cấu trúc bài học của khóa học (lessons + subLessons)
 * Dùng chung cho report và export CSV
 * @param {string} courseId
 * @returns {Promise<Array>} Danh sách subLessons với thông tin đầy đủ
 */
async function getCourseStructure(courseId) {
  const db = getDB();
  const lessons = await db
    .collection("lessons")
    .find({ courseId })
    .sort({ order: 1 })
    .toArray();

  const structure = [];
  for (const lesson of lessons) {
    if (Array.isArray(lesson.subLessons)) {
      for (const sub of lesson.subLessons) {
        structure.push({
          lessonId: lesson.lessonId,
          lessonTitle: lesson.title,
          subLessonId: sub.lessonId,
          subLessonTitle: sub.title,
          order: sub.order || 0,
        });
      }
    }
  }

  structure.sort((a, b) => a.order - b.order);
  return structure;
}

/**
 * Lấy progress map cho danh sách students trong 1 course
 * Dùng chung cho report và export CSV
 * @param {Array<string>} studentIds
 * @param {string} courseId
 * @returns {Promise<Object>} Map { `${userId}_${subLessonId}`: progressDoc }
 */
async function getProgressMap(studentIds, courseId) {
  const db = getDB();
  const allProgress = await db
    .collection("sublesson_progress")
    .find({
      userId: { $in: studentIds },
      courseId: courseId,
    })
    .toArray();

  const progressMap = {};
  for (const p of allProgress) {
    const key = `${p.userId}_${p.subLessonId}`;
    progressMap[key] = p;
  }
  return progressMap;
}

/**
 * Lấy cấu trúc bài học dạng lồng (lesson -> subLessons)
 * Sắp xếp đúng theo lesson.order rồi subLesson.order
 * @param {string} courseId
 * @returns {Promise<Array>} Danh sách lessons, mỗi lesson chứa mảng subLessons
 */
async function getCourseLessonStructure(courseId) {
  const db = getDB();
  const lessons = await db
    .collection("lessons")
    .find({ courseId })
    .sort({ order: 1 })
    .toArray();

  return lessons.map((lesson) => {
    const subLessons = Array.isArray(lesson.subLessons)
      ? [...lesson.subLessons]
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((sub) => ({
            subLessonId: sub.lessonId,
            subLessonTitle: sub.title,
            order: sub.order || 0,
          }))
      : [];

    return {
      lessonId: lesson.lessonId,
      lessonTitle: lesson.title,
      order: lesson.order || 0,
      subLessons,
    };
  });
}

/**
 * Lấy báo cáo điểm học sinh theo khóa học
 * @param {string} courseId
 * @returns {Promise<Object>} Report data
 */
async function getCourseReport(courseId) {
  const db = getDB();

  // 1. Lấy thông tin khóa học
  const course = await db.collection("courses").findOne({ courseId });
  if (!course) return null;

  // 2. Lấy danh sách học sinh đã enroll
  const students = await db
    .collection("users")
    .find({ enrolledCourses: courseId, role: "user" })
    .project({ _id: 1, username: 1, fullname: 1 })
    .toArray();

  // 3. Lấy cấu trúc bài học (cả dạng phẳng cho CSV và dạng lồng cho UI)
  const structure = await getCourseStructure(courseId);
  const lessonStructure = await getCourseLessonStructure(courseId);

  // 4. Lấy tiến độ
  const studentIds = students.map((s) => s._id.toString());
  const progressMap = await getProgressMap(studentIds, courseId);

  // 5. Xây dựng dữ liệu cho từng học sinh
  const studentsData = students.map((student) => {
    const scores = {};
    const lessonScores = {};
    let totalProgress = 0;
    let subLessonCount = 0;

    // Điểm phẳng theo subLesson (giữ tương thích CSV)
    for (const sub of structure) {
      const key = `${student._id.toString()}_${sub.subLessonId}`;
      const progressDoc = progressMap[key];

      scores[sub.subLessonId] = {
        progress: progressDoc?.progress || 0,
        completed: progressDoc?.completed || false,
      };

      totalProgress += progressDoc?.progress || 0;
      subLessonCount++;
    }

    // Tổng hợp theo từng bài lớn
    for (const lesson of lessonStructure) {
      let completedCount = 0;
      let progressSum = 0;
      const totalCount = lesson.subLessons.length;

      for (const sub of lesson.subLessons) {
        const score = scores[sub.subLessonId];
        if (score?.completed) completedCount += 1;
        progressSum += score?.progress || 0;
      }

      const lessonProgress =
        totalCount > 0 ? Math.round(progressSum / totalCount) : 0;

      lessonScores[lesson.lessonId] = {
        completedCount,
        totalCount,
        progress: lessonProgress,
        completed: totalCount > 0 && completedCount === totalCount,
      };
    }

    const averageProgress =
      subLessonCount > 0 ? Math.round(totalProgress / subLessonCount) : 0;

    return {
      userId: student._id.toString(),
      username: student.username,
      fullname: student.fullname || student.username,
      scores,
      lessonScores,
      averageProgress,
    };
  });

  // Sắp xếp theo tên
  studentsData.sort((a, b) => a.fullname.localeCompare(b.fullname, "vi"));

  return {
    courseId,
    courseTitle: course.title,
    structure,
    lessonStructure,
    students: studentsData,
    totalStudents: studentsData.length,
    totalLessons: lessonStructure.length,
    totalSubLessons: structure.length,
  };
}

module.exports = {
  getNextCourseId,
  getAllCourses,
  getMyCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  syncTeacherCourses,
  checkCanEdit,
  getCourseTeachers,
  setTeachers,
  addTeacher,
  removeTeacher,
  getCourseStructure,
  getCourseLessonStructure,
  getProgressMap,
  getCourseReport,
};
