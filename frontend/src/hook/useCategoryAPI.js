// src/hook/useCategoryAPI.js
// Hook API cho quản lý danh mục (categories)
import axios from "axios";
import { useMemo } from "react";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
});

// Tự động thêm token nếu có
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Bổ sung interceptor xử lý 401 như useAdminAPI (nếu có ở chỗ khác, tốt nhất nên redirect hoặc clear token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Xóa token và redirect về login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default function useCategoryAPI() {
  return useMemo(
    () => ({
      // Lấy danh mục theo khóa (courseId = null → global)
      getCategories: (courseId) =>
        API.get("/categories", { params: { courseId: courseId || "null" } }),

      // Lấy danh mục theo khóa cụ thể
      getCategoriesByCourse: (courseId) =>
        API.get(`/categories/by-course/${courseId}`),

      // Tạo danh mục mới
      createCategory: (data) => API.post("/categories", data),

      // Cập nhật danh mục
      updateCategory: (id, data) => API.put(`/categories/${id}`, data),

      // Xóa danh mục
      deleteCategory: (id) => API.delete(`/categories/${id}`),

      // Sao chép danh mục giữa khóa
      copyCategories: (sourceCourseId, targetCourseId) =>
        API.post("/categories/copy", { sourceCourseId, targetCourseId }),
    }),
    []
  );
}
