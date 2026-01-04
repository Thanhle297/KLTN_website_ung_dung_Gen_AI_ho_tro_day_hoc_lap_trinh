import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Box, Snackbar, Alert } from "@mui/material";

import useAdminAPI from "../../hook/useAdminAPI";
import LessonsHeader from "../../components/admin/lessons/LessonsHeader";
import LessonsTable from "../../components/admin/lessons/LessonsTable";
import LessonFormDialog from "../../components/admin/lessons/LessonFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";

const DEFAULT_COURSE_ID = "10";

export default function LessonsCRUD() {
  const api = useAdminAPI();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [filterDisplay, setFilterDisplay] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = useCallback((msg, severity = "success") => {
    setSnack({ open: true, message: msg, severity });
  }, []);

  const closeSnack = useCallback(() => {
    setSnack((prev) => ({ ...prev, open: false }));
  }, []);

  /* ============================ LOAD ============================ */
  const loadLessons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLessonsByCourse(DEFAULT_COURSE_ID);
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showMessage("Lỗi tải bài học", "error");
    } finally {
      setLoading(false);
    }
  }, [api, showMessage]);

  const loadCourses = useCallback(async () => {
    try {
      const res = await api.getCourses();
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      showMessage("Không thể tải danh sách khóa học", "error");
    }
  }, [api, showMessage]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  /* ============================ FILTERED LIST ============================ */
  const filteredLessons = useMemo(() => {
    return lessons
      .filter((l) => {
        if (filterDisplay === "all") return true;
        return String(!!l.display) === filterDisplay;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [lessons, filterDisplay]);

  /* ============================ FORM HANDLERS ============================ */
  const handleAddClick = useCallback(async () => {
    setEditing(null);
    await loadCourses();
    setOpenDialog(true);
  }, [loadCourses]);

  const handleEdit = useCallback(
    async (lesson) => {
      setEditing(lesson);
      await loadCourses();
      setOpenDialog(true);
    },
    [loadCourses]
  );

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const handleFilterChange = useCallback((value) => {
    setFilterDisplay(value);
  }, []);

  /* ============================ SAVE ============================ */
  const handleSave = useCallback(
    async (formData) => {
      if (!formData.lessonId || !formData.courseId || !formData.title) {
        showMessage("lessonId, courseId và title là bắt buộc", "warning");
        return;
      }

      try {
        if (editing) {
          await api.updateLesson(formData.lessonId, formData);
          showMessage("Cập nhật bài học thành công");
        } else {
          await api.createLesson(formData);
          showMessage("Thêm bài học thành công");
        }

        setOpenDialog(false);
        await loadLessons();
      } catch {
        showMessage("Lỗi lưu bài học", "error");
      }
    },
    [editing, api, showMessage, loadLessons]
  );

  /* ============================ DELETE ============================ */
  const handleDeleteClick = useCallback((lesson) => {
    setDeleteTarget(lesson);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await api.deleteLesson(deleteTarget.lessonId);
      showMessage("Xóa thành công");
      setDeleteTarget(null);
      await loadLessons();
    } catch {
      showMessage("Lỗi xóa bài học", "error");
    }
  }, [deleteTarget, api, showMessage, loadLessons]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ============================ TOGGLE DISPLAY ============================ */
  const handleToggleDisplay = useCallback(
    async (lesson, next) => {
      try {
        await api.updateLesson(lesson.lessonId, {
          ...lesson,
          display: next,
        });
        showMessage(next ? "Đã hiển thị bài học" : "Đã ẩn bài học");
        await loadLessons();
      } catch {
        showMessage("Lỗi cập nhật trạng thái hiển thị", "error");
      }
    },
    [api, showMessage, loadLessons]
  );

  /* ============================ RENDER ============================ */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
      }}
    >
      <LessonsHeader
        filterDisplay={filterDisplay}
        onFilterChange={handleFilterChange}
        onAddClick={handleAddClick}
      />

      <LessonsTable
        lessons={filteredLessons}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onToggleDisplay={handleToggleDisplay}
      />

      <LessonFormDialog
        open={openDialog}
        editing={editing}
        courses={courses}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title || ""}
        itemType="bài học"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} onClose={closeSnack} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
