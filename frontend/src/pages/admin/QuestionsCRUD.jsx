import React, { useEffect, useState, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import { toast } from "sonner";

import useAdminAPI from "../../hook/useAdminAPI";
import QuestionsHeader from "../../components/admin/questions/QuestionsHeader";
import QuestionsTable from "../../components/admin/questions/QuestionsTable";
import QuestionFormDialog from "../../components/admin/questions/QuestionFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";
import ImportFromBankModal from "../../components/admin/questions/ImportFromBankModal"; // [NEW]

export default function QuestionsCRUD() {
  const api = useAdminAPI();
  const theme = useTheme();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState("");

  const [subLessons, setSubLessons] = useState([]);
  const [selectedSubLesson, setSelectedSubLesson] = useState("");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [openImport, setOpenImport] = useState(false);

  const notify = useCallback((msg, severity = "success") => {
    if (severity === "error") toast.error(msg);
    else if (severity === "warning") toast.warning(msg);
    else toast.success(msg);
  }, []);

  /* ================= LOAD COURSES ================= */
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

  /* ================= LOAD LESSON ================= */
  const loadLessons = useCallback(async () => {
    if (!selectedCourse) return;
    try {
      const res = await api.getLessonsByCourse(selectedCourse);
      setLessons(res.data);
      // Reset khi đổi khóa học
      setSelectedLesson("");
      setSelectedSubLesson("");
      setSubLessons([]);
      setQuestions([]);
    } catch {
      notify("Lỗi tải bài học", "error");
    }
  }, [api, notify, selectedCourse]);

  /* ================= LOAD SUBLESSON ================= */
  const loadSubLessons = useCallback(async () => {
    if (!selectedLesson || !selectedCourse) return;

    try {
      const res = await api.getSubLessons(selectedLesson, selectedCourse);
      setSubLessons(res.data);
      // Reset khi đổi bài học chính
      setSelectedSubLesson("");
      setQuestions([]);
    } catch {
      notify("Lỗi tải SubLesson", "error");
    }
  }, [selectedLesson, selectedCourse, api, notify]);

  /* ================= LOAD QUESTIONS ================= */
  const loadQuestions = useCallback(async () => {
    if (!selectedSubLesson || !selectedCourse) return;

    try {
      setLoading(true);
      const res = await api.getQuestions(selectedSubLesson, selectedCourse);
      setQuestions(res.data);
    } catch {
      notify("Lỗi tải câu hỏi", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedSubLesson, selectedCourse, api, notify]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourse) loadLessons();
  }, [loadLessons, selectedCourse]);

  useEffect(() => {
    if (selectedLesson && selectedCourse) loadSubLessons();
  }, [loadSubLessons, selectedLesson, selectedCourse]);

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

  const handleCourseChange = useCallback((value) => {
    setSelectedCourse(value);
  }, []);

  const handleLessonChange = useCallback((value) => {
    setSelectedLesson(value);
  }, []);

  const handleSubLessonChange = useCallback((value) => {
    setSelectedSubLesson(value);
  }, []);

  /* ================= SAVE ================= */
  const handleSave = useCallback(
    async (formData) => {
      if (!selectedSubLesson || !formData.question) {
        notify("Thiếu dữ liệu bắt buộc", "warning");
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
          notify("Cập nhật thành công");
        } else {
          await api.createQuestion(payload);
          notify("Thêm thành công");
        }

        setOpenDialog(false);
        loadQuestions();
      } catch {
        notify("Lỗi lưu câu hỏi", "error");
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
      notify("Xóa thành công");
      setDeleteTarget(null);
      loadQuestions();
    } catch {
      notify("Lỗi xóa câu hỏi", "error");
    }
  }, [deleteTarget, api, notify, loadQuestions]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ================= IMPORT ================= */
  const handleOpenImport = useCallback(() => {
    if (!selectedSubLesson) {
      notify("Vui lòng chọn SubLesson trước", "warning");
      return;
    }
    setOpenImport(true);
  }, [selectedSubLesson, notify]);

  const handleImportSuccess = useCallback(
    (count) => {
      notify(`Đã lấy ${count} câu hỏi từ ngân hàng`);
      loadQuestions();
    },
    [notify, loadQuestions]
  );

  /* ================= RENDER UI ================= */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.mode === "dark"
          ? theme.palette.background.default
          : "linear-gradient(135deg, #42A5F5 0%, #2196F3 50%, #1976D2 100%)",
        p: 3,
      }}
    >
      <QuestionsHeader
        courses={courses}
        selectedCourse={selectedCourse}
        onCourseChange={handleCourseChange}
        lessons={lessons}
        selectedLesson={selectedLesson}
        subLessons={subLessons}
        selectedSubLesson={selectedSubLesson}
        onLessonChange={handleLessonChange}
        onSubLessonChange={handleSubLessonChange}
        onAddClick={handleAddClick}
        onImportClick={handleOpenImport}
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
    </Box>
  );
}
