// hooks/useCourses.js
import { useState, useEffect } from "react";

export default function useCourses(apiUrl, fallbackCourses = []) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiUrl) {
      setCourses(fallbackCourses);
      setLoading(false);
      return;
    }

    // ✅ Lấy token từ localStorage
    const token = localStorage.getItem("token");

    // ✅ Thêm Authorization header
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch(apiUrl, { headers })
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch(() => setCourses(fallbackCourses))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  return { courses, loading };
}
