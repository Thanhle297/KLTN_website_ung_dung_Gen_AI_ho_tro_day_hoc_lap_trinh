import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useTheme,
} from "@mui/material";
import { MenuBook } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";
import useCascadeSelector from "../../hook/useCascadeSelector";

import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import LessonsTable from "../../components/admin/lessons/LessonsTable";
import LessonFormDialog from "../../components/admin/lessons/LessonFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";
import { gradientButtonSx } from "../../styles/adminTokens";

export default function LessonsCRUD() {
  const api = useAdminAPI();
  const theme = useTheme();
  const notify = useNotify();

  const cascade = useCascadeSelector(api, { pageKey: "lessons", depth: 1 });
  const { courses, selectedCourse, setCourseId: handleCourseChange } = cascade;

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [filterDisplay, setFilterDisplay] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ============================ LOAD ============================ */
  const loadLessons = useCallback(async () => {
    if (!selectedCourse) return;
    try {
      setLoading(true);
      const res = await api.getLessonsByCourse(selectedCourse);
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      notify.error("Lỗi tải bài học");
    } finally {
      setLoading(false);
    }
  }, [api, notify, selectedCourse]);

  useEffect(() => {
    if (selectedCourse) loadLessons();
  }, [loadLessons, selectedCourse]);

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
  const handleAddClick = useCallback(() => {
    setEditing(null);
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((lesson) => {
    setEditing(lesson);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const handleFilterChange = useCallback((value) => {
    setFilterDisplay(value);
  }, []);

  /* ============================ SAVE ============================ */
  const handleSave = useCallback(
    async (formData) => {
      if (!formData.courseId || !formData.title) {
        notify.warning("courseId và title là bắt buộc");
        return;
      }

      try {
        if (editing) {
          // Lưu ý: truyền thêm current courseId để định vị chính xác
          await api.updateLesson(formData.lessonId, formData, selectedCourse);
          notify.success("Cập nhật bài học thành công");
        } else {
          await api.createLesson(formData);
          notify.success("Thêm bài học thành công");
        }

        setOpenDialog(false);
        await loadLessons();
      } catch {
        notify.error("Lỗi lưu bài học");
      }
    },
    [editing, api, notify, loadLessons, selectedCourse]
  );

  /* ============================ DELETE ============================ */
  const handleDeleteClick = useCallback((lesson) => {
    setDeleteTarget(lesson);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await api.deleteLesson(deleteTarget.lessonId, selectedCourse);
      notify.success("Xóa thành công");
      setDeleteTarget(null);
      await loadLessons();
    } catch {
      notify.error("Lỗi xóa bài học");
    }
  }, [deleteTarget, api, notify, loadLessons, selectedCourse]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ============================ TOGGLE DISPLAY ============================ */
  const handleToggleDisplay = useCallback(
    async (lesson, next) => {
      try {
        await api.updateLesson(
          lesson.lessonId,
          {
            ...lesson,
            display: next,
          },
          selectedCourse
        );
        notify.success(next ? "Đã hiển thị bài học" : "Đã ẩn bài học");
        await loadLessons();
      } catch {
        notify.error("Lỗi cập nhật trạng thái hiển thị");
      }
    },
    [api, notify, loadLessons, selectedCourse]
  );

  /* ============================ RENDER ============================ */
  return (
    <AdminPageWrapper>
      <AdminPageHeader
        icon={<MenuBook />}
        title="Quản lý Bài học"
        subtitle={selectedCourse ? `Khóa: ${courses.find(c => c.courseId === selectedCourse)?.title || selectedCourse}` : "Chọn khóa học"}
        actions={
          <Button variant="contained" onClick={handleAddClick} sx={gradientButtonSx(theme)}>
            Thêm bài học
          </Button>
        }
        filters={
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Khóa học</InputLabel>
              <Select label="Khóa học" value={selectedCourse} onChange={(e) => handleCourseChange(e.target.value)}>
                {courses?.map((c) => (
                  <MenuItem key={c.courseId} value={c.courseId}>{c.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Hiển thị</InputLabel>
              <Select label="Hiển thị" value={filterDisplay} onChange={(e) => handleFilterChange(e.target.value)}>
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="true">Đang hiển thị</MenuItem>
                <MenuItem value="false">Đang ẩn</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        }
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
        defaultCourseId={selectedCourse}
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
    </AdminPageWrapper>
  );
}
