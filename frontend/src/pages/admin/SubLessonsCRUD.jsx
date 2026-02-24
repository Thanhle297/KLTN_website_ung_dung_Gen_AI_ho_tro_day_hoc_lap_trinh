import React, { useEffect, useState, useCallback } from "react";
import { Box, Snackbar, Alert } from "@mui/material";

import useAdminAPI from "../../hook/useAdminAPI";
import SubLessonsHeader from "../../components/admin/sublessons/SubLessonsHeader";
import SubLessonsTable from "../../components/admin/sublessons/SubLessonsTable";
import SubLessonFormDialog from "../../components/admin/sublessons/SubLessonFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";

export default function SubLessonsCRUD() {
  const api = useAdminAPI();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  const [lessonList, setLessonList] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState("");

  const [subLessons, setSubLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = useCallback((msg, severity = "success") => {
    setSnack({ open: true, message: msg, severity });
  }, []);

  const closeSnack = useCallback(() => {
    setSnack((s) => ({ ...s, open: false }));
  }, []);

  /* ------- LOAD danh sách Khóa học ------- */
  const loadCourses = useCallback(async () => {
    try {
      const res = await api.getCourses();
      const list = Array.isArray(res.data) ? res.data : [];
      setCourses(list);
      if (!selectedCourse && list.length > 0) {
        setSelectedCourse(list[0].courseId);
      }
    } catch {
      notify("Không thể tải danh sách khóa học", "error");
    }
  }, [api, notify, selectedCourse]);

  /* ------- LOAD danh sách bài lớn theo khóa học ------- */
  const loadLessons = useCallback(async () => {
    if (!selectedCourse) return;
    try {
      const res = await api.getLessonsByCourse(selectedCourse);
      setLessonList(res.data);
      // Reset selected lesson khi đổi course
      setSelectedLesson("");
      setSubLessons([]);
    } catch {
      notify("Lỗi tải danh sách bài học", "error");
    }
  }, [api, notify, selectedCourse]);

  /* ------- LOAD subLessons theo bài và khóa học ------- */
  const loadSubLessons = useCallback(async () => {
    if (!selectedLesson || !selectedCourse) return;

    try {
      setLoading(true);
      const res = await api.getSubLessons(selectedLesson, selectedCourse);
      setSubLessons(res.data);
    } catch {
      notify("Lỗi tải sublesson", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedLesson, selectedCourse, api, notify]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourse) loadLessons();
  }, [loadLessons, selectedCourse]);

  useEffect(() => {
    if (selectedLesson && selectedCourse) loadSubLessons();
  }, [loadSubLessons, selectedLesson, selectedCourse]);

  /* ------- FORM ------- */
  const handleAddClick = useCallback(() => {
    setEditing(null);
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((subLesson) => {
    setEditing(subLesson);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const handleCourseChange = useCallback((value) => {
    setSelectedCourse(value);
  }, []);

  const handleLessonChange = useCallback((value) => {
    setSelectedLesson(value);
  }, []);

  /* ------- SAVE ------- */
  const handleSave = useCallback(
    async (formData) => {
      if (!selectedLesson || !formData.title) {
        notify("Vui lòng chọn bài học cha và nhập title", "warning");
        return;
      }

      try {
        if (editing) {
          await api.updateSubLesson(
            selectedLesson,
            editing.lessonId,
            formData,
            selectedCourse
          );
          notify("Cập nhật thành công");
        } else {
          await api.createSubLesson(selectedLesson, formData, selectedCourse);
          notify("Thêm sublesson thành công");
        }
        setOpenDialog(false);
        loadSubLessons();
      } catch {
        notify("Lỗi lưu sublesson", "error");
      }
    },
    [selectedLesson, selectedCourse, editing, api, notify, loadSubLessons]
  );

  /* ------- DELETE ------- */
  const handleDeleteClick = useCallback((subLesson) => {
    setDeleteTarget(subLesson);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget || !selectedLesson || !selectedCourse) return;

    try {
      await api.deleteSubLesson(
        selectedLesson,
        deleteTarget.lessonId,
        selectedCourse
      );
      notify("Xóa thành công");
      setDeleteTarget(null);
      loadSubLessons();
    } catch {
      notify("Lỗi xóa sublesson", "error");
    }
  }, [
    deleteTarget,
    selectedLesson,
    selectedCourse,
    api,
    notify,
    loadSubLessons,
  ]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ------- RENDER ------- */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #42A5F5 0%, #2196F3 50%, #1976D2 100%)",
        p: 3,
      }}
    >
      <SubLessonsHeader
        courses={courses}
        selectedCourse={selectedCourse}
        onCourseChange={handleCourseChange}
        lessonList={lessonList}
        selectedLesson={selectedLesson}
        onLessonChange={handleLessonChange}
        onAddClick={handleAddClick}
      />

      <SubLessonsTable
        subLessons={subLessons}
        loading={loading}
        selectedLesson={selectedLesson}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <SubLessonFormDialog
        open={openDialog}
        editing={editing}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title || ""}
        itemType="subLesson"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
