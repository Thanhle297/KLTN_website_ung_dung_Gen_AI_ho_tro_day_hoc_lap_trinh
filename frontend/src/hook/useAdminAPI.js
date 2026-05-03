// src/hook/useAdminAPI.js
import axios from "axios";
import { useMemo } from "react";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
});

// tự động thêm token nếu có
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Xử lý 401: token hết hạn → redirect về login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default function useAdminAPI() {
  return useMemo(
    () => ({
      /* ===== USER ===== */
      getUsers: () => API.get("/users"),
      getUser: (id) => API.get(`/users/${id}`),
      getTeachers: () => API.get("/users/teachers"),
      createUser: (data) => API.post("/users", data),
      updateUser: (id, data) => API.put(`/users/${id}`, data),
      deleteUser: (id) => API.delete(`/users/${id}`),
      //restore password
      adminChangePassword: (id, newPassword) =>
        API.put(`/restore-pass/${id}/password`, { newPassword }),

      /* ===== COURSE ===== */
      getCourses: () => API.get("/courses"),
      getCourse: (courseId) => API.get(`/courses/${courseId}`),
      createCourse: (data) => API.post("/courses", data),
      updateCourse: (courseId, data) => API.put(`/courses/${courseId}`, data),
      deleteCourse: (courseId) => API.delete(`/courses/${courseId}`),

      /* ===== COURSE TEACHERS ===== */
      getCourseTeachers: (courseId) => API.get(`/courses/${courseId}/teachers`),
      setCourseTeachers: (courseId, teacherIds) =>
        API.post(`/courses/${courseId}/teachers`, { teacherIds }),
      addCourseTeacher: (courseId, teacherId) =>
        API.put(`/courses/${courseId}/teachers/add`, { teacherId }),
      removeCourseTeacher: (courseId, teacherId) =>
        API.put(`/courses/${courseId}/teachers/remove`, { teacherId }),

      /* ===== COURSE - Edit Permission ===== */
      canEditCourse: (courseId) => API.get(`/courses/${courseId}/can-edit`),

      /* ===== LESSON ===== */
      getLessonsByCourse: (courseId) => API.get(`/lessons/course/${courseId}`),
      getLesson: (lessonId, courseId) =>
        API.get(`/lessons/${lessonId}`, { params: { courseId } }),
      getLessonDetail: (lessonId, courseId) =>
        API.get(`/lessons/detail/${lessonId}`, { params: { courseId } }),
      createLesson: (data) => API.post("/lessons", data),
      updateLesson: (lessonId, data, courseId) =>
        API.put(`/lessons/${lessonId}`, data, {
          params: { courseId: courseId || data.courseId },
        }),
      deleteLesson: (lessonId, courseId) =>
        API.delete(`/lessons/${lessonId}`, { params: { courseId } }),
      reorderLessons: (courseId, lessonIds) =>
        API.put("/lessons/reorder/batch", { courseId, lessonIds }),

      /* ===== SUBLESSON ===== */
      getSubLessons: (lessonId, courseId) =>
        API.get(`/sublessons/${lessonId}/sub`, { params: { courseId } }),
      createSubLesson: (lessonId, data, courseId) =>
        API.post(`/sublessons/${lessonId}/sub`, data, { params: { courseId } }),
      updateSubLesson: (lessonId, subId, data, courseId) =>
        API.put(`/sublessons/${lessonId}/sub/${subId}`, data, {
          params: { courseId },
        }),
      deleteSubLesson: (lessonId, subId, courseId) =>
        API.delete(`/sublessons/${lessonId}/sub/${subId}`, {
          params: { courseId },
        }),
      reorderSubLessons: (lessonId, subLessonIds, courseId) =>
        API.put(`/sublessons/${lessonId}/reorder`, { subLessonIds }, {
          params: { courseId },
        }),

      /* ===== QUESTION ===== */
      getQuestions: (lessonId, courseId) =>
        API.get(`/questions`, { params: { lessonId, courseId } }),
      getBankQuestions: (category, courseId, categoryId) =>
        API.get(`/questions`, {
          params: {
            isBank: true,
            category,
            courseId: courseId !== undefined ? courseId : undefined,
            categoryId,
          },
        }),
      getQuestion: (id) => API.get(`/questions/${id}`),
      createQuestion: (data) => API.post("/questions", data),
      updateQuestion: (id, data) => API.put(`/questions/${id}`, data),
      deleteQuestion: (id) => API.delete(`/questions/${id}`),
      assignQuestionsToLesson: (questionIds, targetLessonId, courseId) =>
        API.post("/questions/assign", {
          questionIds,
          targetLessonId,
          courseId,
        }),
      reorderQuestions: (questionIds) =>
        API.put("/questions/reorder/batch", { questionIds }),

      /* ===== QUESTION BANK - Import / Copy / Promote ===== */
      importToCourseBank: (questionIds, targetCourseId) =>
        API.post("/questions/import-to-course", {
          questionIds,
          targetCourseId,
        }),
      copyBetweenCourses: (questionIds, sourceCourseId, targetCourseId, copyCategories = true) =>
        API.post("/questions/copy-between-courses", {
          questionIds,
          sourceCourseId,
          targetCourseId,
          copyCategories,
        }),
      promoteToGlobal: (questionIds, sourceCourseId, skipDuplicateCheck = false) =>
        API.post("/questions/promote-to-global", {
          questionIds,
          sourceCourseId,
          skipDuplicateCheck,
        }),

      /* ===== ENROLLMENT ===== */
      enrollUserToCourse: (userId, courseId) =>
        API.post("/enrollments/enroll", { userId, courseId }),
      unenrollUserFromCourse: (userId, courseId) =>
        API.post("/enrollments/unenroll", { userId, courseId }),
      bulkEnrollUsers: (userIds, courseIds) =>
        API.post("/enrollments/bulk-enroll", { userIds, courseIds }),
      bulkUpdateEnrollments: (payload) => API.post("/enrollments/bulk", payload),
      getCourseUsers: (courseId) =>
        API.get(`/enrollments/course/${courseId}/users`),
      getUserCourses: (userId) =>
        API.get(`/enrollments/user/${userId}/courses`),

      /* ===== LOGIN SESSIONS (Tracking) ===== */
      getLoginSessions: (params) => API.get("/sessions", { params }),
      getSessionStats: (params) => API.get("/sessions/stats", { params }),
      getUserSessions: (userId, params) =>
        API.get(`/sessions/user/${userId}`, { params }),
      getOnlineUsers: () => API.get("/sessions/online"),

      /* ===== ADMIN DASHBOARD STATS ===== */
      getDashboardStats: () => API.get("/admin/stats"),
    }),
    []
  );
}
