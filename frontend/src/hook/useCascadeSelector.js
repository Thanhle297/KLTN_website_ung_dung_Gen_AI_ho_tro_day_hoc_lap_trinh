// =============================================================================
// useCascadeSelector.js - Hook cascade selector cho Course → Lesson → SubLesson
// -----------------------------------------------------------------------------
// Dùng cho LessonsCRUD, SubLessonsCRUD, QuestionsCRUD — 3 trang cần dropdown
// cascade chọn khóa học → bài học → sublesson.
//
// Tính năng:
//   - Tự động load courses khi mount
//   - Tự động load lessons khi selectedCourse thay đổi
//   - Tự động load subLessons khi selectedLesson thay đổi (nếu depth >= 3)
//   - Lưu lựa chọn cuối cùng vào sessionStorage (remember last selection)
//   - Tự động chọn course đầu tiên nếu chưa có selection
//
// Cách dùng:
//   const cascade = useCascadeSelector(api, { pageKey: "lessons", depth: 1 });
//   // depth=1: chỉ course (LessonsCRUD)
//   // depth=2: course → lesson (SubLessonsCRUD)
//   // depth=3: course → lesson → sublesson (QuestionsCRUD)
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_PREFIX = "admin_cascade_";

/**
 * @param {object} api        - instance từ useAdminAPI()
 * @param {object} options
 * @param {string} options.pageKey  - key duy nhất cho mỗi trang (lưu sessionStorage)
 * @param {number} options.depth    - 1 | 2 | 3 (số cấp dropdown)
 */
export default function useCascadeSelector(api, { pageKey, depth = 1 }) {
  const storageKey = STORAGE_PREFIX + pageKey;

  // Khôi phục selection từ sessionStorage
  const savedSelection = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [storageKey]);

  // ===== State =====
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(savedSelection.course || "");

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(savedSelection.lesson || "");

  const [subLessons, setSubLessons] = useState([]);
  const [selectedSubLesson, setSelectedSubLesson] = useState(savedSelection.subLesson || "");

  const [loading, setLoading] = useState(false);

  // ===== Persist selection =====
  useEffect(() => {
    const data = { course: selectedCourse };
    if (depth >= 2) data.lesson = selectedLesson;
    if (depth >= 3) data.subLesson = selectedSubLesson;
    sessionStorage.setItem(storageKey, JSON.stringify(data));
  }, [selectedCourse, selectedLesson, selectedSubLesson, depth, storageKey]);

  // ===== Load courses =====
  const loadCourses = useCallback(async () => {
    try {
      const res = await api.getCourses();
      const list = Array.isArray(res.data) ? res.data : [];
      setCourses(list);
      // Tự chọn course đầu nếu chưa có selection hợp lệ
      if (list.length > 0 && !list.some((c) => c.courseId === selectedCourse)) {
        setSelectedCourse(list[0].courseId);
      }
    } catch {
      // Lỗi do caller xử lý qua notify
    }
  }, [api, selectedCourse]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // ===== Load lessons (depth >= 1 luôn cần để liệt kê bài) =====
  const loadLessons = useCallback(async () => {
    if (!selectedCourse) return;
    try {
      const res = await api.getLessonsByCourse(selectedCourse);
      const list = Array.isArray(res.data) ? res.data : [];
      setLessons(list);

      // Giữ selection cũ nếu vẫn hợp lệ, không thì reset
      if (depth >= 2 && !list.some((l) => l.lessonId === selectedLesson)) {
        setSelectedLesson("");
        setSubLessons([]);
        setSelectedSubLesson("");
      }
    } catch {
      setLessons([]);
    }
  }, [api, selectedCourse, selectedLesson, depth]);

  useEffect(() => {
    if (selectedCourse) loadLessons();
  }, [loadLessons, selectedCourse]);

  // ===== Load subLessons (depth >= 3) =====
  const loadSubLessons = useCallback(async () => {
    if (depth < 3 || !selectedLesson || !selectedCourse) return;
    try {
      const res = await api.getSubLessons(selectedLesson, selectedCourse);
      const list = Array.isArray(res.data) ? res.data : [];
      setSubLessons(list);
      if (!list.some((s) => s.lessonId === selectedSubLesson)) {
        setSelectedSubLesson("");
      }
    } catch {
      setSubLessons([]);
    }
  }, [api, selectedCourse, selectedLesson, selectedSubLesson, depth]);

  useEffect(() => {
    if (depth >= 3 && selectedLesson && selectedCourse) loadSubLessons();
  }, [loadSubLessons, selectedLesson, selectedCourse, depth]);

  // ===== Change handlers (reset children) =====
  const handleCourseChange = useCallback(
    (value) => {
      setSelectedCourse(value);
      if (depth >= 2) {
        setSelectedLesson("");
        setSubLessons([]);
        setSelectedSubLesson("");
      }
    },
    [depth]
  );

  const handleLessonChange = useCallback(
    (value) => {
      setSelectedLesson(value);
      if (depth >= 3) {
        setSelectedSubLesson("");
      }
    },
    [depth]
  );

  const handleSubLessonChange = useCallback((value) => {
    setSelectedSubLesson(value);
  }, []);

  return {
    // Data lists
    courses,
    lessons,
    subLessons,
    // Selected values
    selectedCourse,
    selectedLesson,
    selectedSubLesson,
    // Setters
    setCourseId: handleCourseChange,
    setLessonId: handleLessonChange,
    setSubLessonId: handleSubLessonChange,
    // Reloaders
    reloadCourses: loadCourses,
    reloadLessons: loadLessons,
    reloadSubLessons: loadSubLessons,
    // Loading
    loading,
    setLoading,
  };
}
