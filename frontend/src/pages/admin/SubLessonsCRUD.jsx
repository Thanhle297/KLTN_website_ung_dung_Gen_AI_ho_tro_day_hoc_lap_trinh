import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useTheme,
} from "@mui/material";
import { Article } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";
import useCascadeSelector from "../../hook/useCascadeSelector";

import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import SubLessonsTable from "../../components/admin/sublessons/SubLessonsTable";
import SubLessonFormDialog from "../../components/admin/sublessons/SubLessonFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";
import { gradientButtonSx } from "../../styles/adminTokens";

export default function SubLessonsCRUD() {
  const api = useAdminAPI();
  const theme = useTheme();
  const notify = useNotify();

  const cascade = useCascadeSelector(api, { pageKey: "sublessons", depth: 2 });
  const {
    courses,
    selectedCourse,
    setCourseId: handleCourseChange,
    lessons: lessonList,
    selectedLesson,
    setLessonId: handleLessonChange,
  } = cascade;

  const [subLessons, setSubLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ------- LOAD subLessons theo bài và khóa học ------- */
  const loadSubLessons = useCallback(async () => {
    if (!selectedLesson || !selectedCourse) return;

    try {
      setLoading(true);
      const res = await api.getSubLessons(selectedLesson, selectedCourse);
      setSubLessons(res.data);
    } catch {
      notify.error("Lỗi tải sublesson");
    } finally {
      setLoading(false);
    }
  }, [selectedLesson, selectedCourse, api, notify]);

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

  /* ------- SAVE ------- */
  const handleSave = useCallback(
    async (formData) => {
      if (!selectedLesson || !formData.title) {
        notify.warning("Vui lòng chọn bài học cha và nhập title");
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
          notify.success("Cập nhật thành công");
        } else {
          await api.createSubLesson(selectedLesson, formData, selectedCourse);
          notify.success("Thêm sublesson thành công");
        }
        setOpenDialog(false);
        loadSubLessons();
      } catch {
        notify.error("Lỗi lưu sublesson");
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
      notify.success("Xóa thành công");
      setDeleteTarget(null);
      loadSubLessons();
    } catch {
      notify.error("Lỗi xóa sublesson");
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
    <AdminPageWrapper>
      <AdminPageHeader
        icon={<Article />}
        title="Quản lý SubLesson"
        subtitle={
          selectedLesson
            ? `Bài: ${lessonList.find((l) => l.lessonId === selectedLesson)?.title || selectedLesson}`
            : "Chọn bài học"
        }
        actions={
          selectedLesson && (
            <Button
              variant="contained"
              onClick={handleAddClick}
              sx={gradientButtonSx(theme)}
            >
              Thêm SubLesson
            </Button>
          )
        }
        filters={
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Khóa học</InputLabel>
              <Select
                label="Khóa học"
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                {courses?.map((c) => (
                  <MenuItem key={c.courseId} value={c.courseId}>
                    {c.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Bài học</InputLabel>
              <Select
                label="Bài học"
                value={selectedLesson}
                onChange={(e) => handleLessonChange(e.target.value)}
              >
                {lessonList.map((l) => (
                  <MenuItem key={l.lessonId} value={l.lessonId}>
                    {l.lessonId} — {l.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        }
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
    </AdminPageWrapper>
  );
}
