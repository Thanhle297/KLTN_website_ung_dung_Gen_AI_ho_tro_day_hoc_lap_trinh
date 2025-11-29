// src/hook/useAdminAPI.js
import axios from "axios";

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
  return {
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
    getLesson: (lessonId) => API.get(`/lessons/${lessonId}`),
    createLesson: (data) => API.post("/lessons", data),
    updateLesson: (lessonId, data) => API.put(`/lessons/${lessonId}`, data),
    deleteLesson: (lessonId) => API.delete(`/lessons/${lessonId}`),

    /* ===== SUBLESSON ===== */
    getSubLessons: (lessonId) => API.get(`/sublessons/${lessonId}/sub`),
    createSubLesson: (lessonId, data) =>
      API.post(`/sublessons/${lessonId}/sub`, data),
    updateSubLesson: (lessonId, subId, data) =>
      API.put(`/sublessons/${lessonId}/sub/${subId}`, data),
    deleteSubLesson: (lessonId, subId) =>
      API.delete(`/sublessons/${lessonId}/sub/${subId}`),

    /* ===== QUESTION ===== */
    getQuestions: (lessonId) => API.get(`/questions`, { params: { lessonId } }),
    getQuestion: (id) => API.get(`/questions/${id}`),
    createQuestion: (data) => API.post("/questions", data),
    updateQuestion: (id, data) => API.put(`/questions/${id}`, data),
    deleteQuestion: (id) => API.delete(`/questions/${id}`),
  };
}
