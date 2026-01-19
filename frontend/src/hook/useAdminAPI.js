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

export default function useAdminAPI() {
  return useMemo(
    () => ({
      /* ===== USER ===== */
      getUsers: () => API.get("/users"),
      getUser: (id) => API.get(`/users/${id}`),
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

      /* ===== LESSON ===== */
      getLessonsByCourse: (courseId) => API.get(`/lessons/course/${courseId}`),
      getLesson: (lessonId, courseId) =>
        API.get(`/lessons/${lessonId}`, { params: { courseId } }),
      createLesson: (data) => API.post("/lessons", data),
      updateLesson: (lessonId, data, courseId) =>
        API.put(`/lessons/${lessonId}`, data, {
          params: { courseId: courseId || data.courseId },
        }),
      deleteLesson: (lessonId, courseId) =>
        API.delete(`/lessons/${lessonId}`, { params: { courseId } }),

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

      /* ===== QUESTION ===== */
      getQuestions: (lessonId, courseId) =>
        API.get(`/questions`, { params: { lessonId, courseId } }),
      getBankQuestions: (category) =>
        API.get(`/questions`, { params: { isBank: true, category } }),
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

      /* ===== ENROLLMENT ===== */
      enrollUserToCourse: (userId, courseId) =>
        API.post("/enrollments/enroll", { userId, courseId }),
      unenrollUserFromCourse: (userId, courseId) =>
        API.post("/enrollments/unenroll", { userId, courseId }),
      bulkEnrollUsers: (userIds, courseIds) =>
        API.post("/enrollments/bulk-enroll", { userIds, courseIds }),
      getCourseUsers: (courseId) =>
        API.get(`/enrollments/course/${courseId}/users`),
      getUserCourses: (userId) =>
        API.get(`/enrollments/user/${userId}/courses`),
    }),
    []
  );
}
