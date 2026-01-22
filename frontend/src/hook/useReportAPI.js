// src/hook/useReportAPI.js
// Hook để gọi các API báo cáo điểm học sinh
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

export default function useReportAPI() {
  return useMemo(
    () => ({
      /**
       * Lấy báo cáo điểm học sinh theo khóa học
       * @param {string} courseId - ID khóa học
       * @returns {Promise} - Dữ liệu báo cáo bao gồm structure và students
       */
      getCourseReport: (courseId) => API.get(`/courses/${courseId}/report`),

      /**
       * Xuất điểm ra file CSV
       * @param {string} courseId - ID khóa học
       * @returns {Promise} - File CSV blob
       */
      exportScoresCSV: (courseId) =>
        API.get(`/csv/export-scores/${courseId}`, {
          responseType: "blob",
        }),

      /**
       * Tải file CSV xuống máy
       * @param {Blob} blob - Dữ liệu file
       * @param {string} filename - Tên file
       */
      downloadCSV: (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      },
    }),
    []
  );
}
