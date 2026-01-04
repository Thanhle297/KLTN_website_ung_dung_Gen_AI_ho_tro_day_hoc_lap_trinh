import React, { useEffect, useState, useCallback } from "react";
import { Box, Snackbar, Alert } from "@mui/material";

import useAdminAPI from "../../hook/useAdminAPI";
import SubLessonsHeader from "../../components/admin/sublessons/SubLessonsHeader";
import SubLessonsTable from "../../components/admin/sublessons/SubLessonsTable";
import SubLessonFormDialog from "../../components/admin/sublessons/SubLessonFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";

export default function SubLessonsCRUD() {
  const api = useAdminAPI();

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

  /* ------- LOAD danh sách bài lớn ------- */
  const loadLessons = useCallback(async () => {
    try {
      const res = await api.getLessonsByCourse("10"); // tùy course
      setLessonList(res.data);
    } catch {
      notify("Lỗi tải danh sách bài học", "error");
    }
  }, [api, notify]);

  /* ------- LOAD subLessons theo bài ------- */
  const loadSubLessons = useCallback(async () => {
    if (!selectedLesson) return;

    try {
      setLoading(true);
      const res = await api.getSubLessons(selectedLesson);
      setSubLessons(res.data);
    } catch {
      notify("Lỗi tải sublesson", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedLesson, api, notify]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    loadSubLessons();
  }, [loadSubLessons]);

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

  const handleLessonChange = useCallback((value) => {
    setSelectedLesson(value);
  }, []);

  /* ------- SAVE ------- */
  const handleSave = useCallback(
    async (formData) => {
      if (!selectedLesson || !formData.lessonId || !formData.title) {
        notify("Các trường lessonId, title là bắt buộc", "warning");
        return;
      }

      try {
        if (editing) {
          await api.updateSubLesson(selectedLesson, editing.lessonId, formData);
          notify("Cập nhật thành công");
        } else {
          await api.createSubLesson(selectedLesson, formData);
          notify("Thêm sublesson thành công");
        }
        setOpenDialog(false);
        loadSubLessons();
      } catch {
        notify("Lỗi lưu sublesson", "error");
      }
    },
    [selectedLesson, editing, api, notify, loadSubLessons]
  );

  /* ------- DELETE ------- */
  const handleDeleteClick = useCallback((subLesson) => {
    setDeleteTarget(subLesson);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await api.deleteSubLesson(selectedLesson, deleteTarget.lessonId);
      notify("Xóa thành công");
      setDeleteTarget(null);
      loadSubLessons();
    } catch {
      notify("Lỗi xóa sublesson", "error");
    }
  }, [deleteTarget, selectedLesson, api, notify, loadSubLessons]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ------- RENDER ------- */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
      }}
    >
      <SubLessonsHeader
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
