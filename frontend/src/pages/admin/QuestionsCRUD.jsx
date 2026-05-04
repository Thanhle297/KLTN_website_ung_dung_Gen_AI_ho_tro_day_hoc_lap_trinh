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
import { Quiz } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";
import useCascadeSelector from "../../hook/useCascadeSelector";

import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import QuestionsTable from "../../components/admin/questions/QuestionsTable";
import QuestionFormDialog from "../../components/admin/questions/QuestionFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";
import ImportFromBankModal from "../../components/admin/questions/ImportFromBankModal";
import { gradientButtonSx } from "../../styles/adminTokens";

export default function QuestionsCRUD() {
  const api = useAdminAPI();
  const theme = useTheme();
  const notify = useNotify();

  /* ================= CASCADE SELECTOR ================= */
  const cascade = useCascadeSelector(api, { pageKey: "questions", depth: 3 });
  const {
    courses, selectedCourse, setCourseId: handleCourseChange,
    lessons, selectedLesson, setLessonId: handleLessonChange,
    subLessons, selectedSubLesson, setSubLessonId: handleSubLessonChange,
  } = cascade;

  /* ================= LOCAL STATE ================= */
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [openImport, setOpenImport] = useState(false);

  /* ================= LOAD QUESTIONS ================= */
  const loadQuestions = useCallback(async () => {
    if (!selectedSubLesson || !selectedCourse) return;

    try {
      setLoading(true);
      const res = await api.getQuestions(selectedSubLesson, selectedCourse);
      setQuestions(res.data);
    } catch {
      notify.error("Lỗi tải câu hỏi");
    } finally {
      setLoading(false);
    }
  }, [selectedSubLesson, selectedCourse, api, notify]);

  useEffect(() => {
    if (selectedSubLesson && selectedCourse) loadQuestions();
  }, [loadQuestions, selectedSubLesson, selectedCourse]);

  /* ================= FORM ================= */
  const handleAddClick = useCallback(() => {
    setEditing(null);
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((question) => {
    setEditing(question);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  /* ================= SAVE ================= */
  const handleSave = useCallback(
    async (formData) => {
      if (!selectedSubLesson || !formData.question) {
        notify.warning("Thiếu dữ liệu bắt buộc");
        return;
      }

      const topicId = selectedSubLesson.replace("bai", "").split("_")[0];

      const payload = {
        ...formData,
        lessonId: selectedSubLesson,
        topic: topicId,
        courseId: selectedCourse,
      };

      try {
        if (editing) {
          await api.updateQuestion(editing.id, payload);
          notify.success("Cập nhật thành công");
        } else {
          await api.createQuestion(payload);
          notify.success("Thêm thành công");
        }

        setOpenDialog(false);
        loadQuestions();
      } catch {
        notify.error("Lỗi lưu câu hỏi");
      }
    },
    [selectedSubLesson, selectedCourse, editing, api, notify, loadQuestions]
  );

  /* ================= DELETE ================= */
  const handleDeleteClick = useCallback((question) => {
    setDeleteTarget(question);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await api.deleteQuestion(deleteTarget.id);
      notify.success("Xóa thành công");
      setDeleteTarget(null);
      loadQuestions();
    } catch {
      notify.error("Lỗi xóa câu hỏi");
    }
  }, [deleteTarget, api, notify, loadQuestions]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ================= IMPORT ================= */
  const handleOpenImport = useCallback(() => {
    if (!selectedSubLesson) {
      notify.warning("Vui lòng chọn SubLesson trước");
      return;
    }
    setOpenImport(true);
  }, [selectedSubLesson, notify]);

  const handleImportSuccess = useCallback(
    (count) => {
      notify.success(`Đã lấy ${count} câu hỏi từ ngân hàng`);
      loadQuestions();
    },
    [notify, loadQuestions]
  );

  /* ================= RENDER UI ================= */
  return (
    <AdminPageWrapper>
      <AdminPageHeader
        icon={<Quiz />}
        title="Quản lý Câu hỏi"
        subtitle={selectedSubLesson ? `SubLesson: ${selectedSubLesson}` : "Chọn SubLesson"}
        actions={
          selectedSubLesson && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={handleOpenImport}
                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
              >
                Lấy từ Bank
              </Button>
              <Button
                variant="contained"
                onClick={handleAddClick}
                sx={gradientButtonSx(theme)}
              >
                Thêm câu hỏi
              </Button>
            </Stack>
          )
        }
        filters={
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
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
            <FormControl size="small" fullWidth>
              <InputLabel>Bài học</InputLabel>
              <Select
                label="Bài học"
                value={selectedLesson}
                onChange={(e) => handleLessonChange(e.target.value)}
              >
                {lessons?.map((l) => (
                  <MenuItem key={l.lessonId} value={l.lessonId}>
                    {l.lessonId} — {l.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedLesson && (
              <FormControl size="small" fullWidth>
                <InputLabel>SubLesson</InputLabel>
                <Select
                  label="SubLesson"
                  value={selectedSubLesson}
                  onChange={(e) => handleSubLessonChange(e.target.value)}
                >
                  {subLessons?.map((s) => (
                    <MenuItem key={s.lessonId} value={s.lessonId}>
                      {s.lessonId} — {s.displayId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        }
      />

      <QuestionsTable
        questions={questions}
        loading={loading}
        selectedSubLesson={selectedSubLesson}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <QuestionFormDialog
        open={openDialog}
        editing={editing}
        onClose={handleCloseDialog}
        onSave={handleSave}
        courseId={selectedCourse}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={`Câu hỏi ID: ${deleteTarget?.id || ""}`}
        itemType="câu hỏi"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ImportFromBankModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        targetLessonId={selectedSubLesson}
        courseId={selectedCourse}
        onSuccess={handleImportSuccess}
      />
    </AdminPageWrapper>
  );
}
