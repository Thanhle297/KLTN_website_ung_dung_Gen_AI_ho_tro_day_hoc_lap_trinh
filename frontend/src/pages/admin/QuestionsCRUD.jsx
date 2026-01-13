import React, { useEffect, useState, useCallback } from "react";
import { Box, Snackbar, Alert } from "@mui/material";

import useAdminAPI from "../../hook/useAdminAPI";
import QuestionsHeader from "../../components/admin/questions/QuestionsHeader";
import QuestionsTable from "../../components/admin/questions/QuestionsTable";
import QuestionFormDialog from "../../components/admin/questions/QuestionFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";
import ImportFromBankModal from "../../components/admin/questions/ImportFromBankModal"; // [NEW]

export default function QuestionsCRUD() {
  const api = useAdminAPI();

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState("");

  const [subLessons, setSubLessons] = useState([]);
  const [selectedSubLesson, setSelectedSubLesson] = useState("");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [openImport, setOpenImport] = useState(false); // [NEW]

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

  /* ================= LOAD LESSON ================= */
  const loadLessons = useCallback(async () => {
    try {
      const res = await api.getLessonsByCourse("10");
      setLessons(res.data);
    } catch {
      notify("Lỗi tải bài học", "error");
    }
  }, [api, notify]);

  /* ================= LOAD SUBLESSON ================= */
  const loadSubLessons = useCallback(async () => {
    if (!selectedLesson) return;

    try {
      const res = await api.getSubLessons(selectedLesson);
      setSubLessons(res.data);
    } catch {
      notify("Lỗi tải SubLesson", "error");
    }
  }, [selectedLesson, api, notify]);

  /* ================= LOAD QUESTIONS ================= */
  const loadQuestions = useCallback(async () => {
    if (!selectedSubLesson) return;

    try {
      setLoading(true);
      const res = await api.getQuestions(selectedSubLesson);
      setQuestions(res.data);
    } catch {
      notify("Lỗi tải câu hỏi", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedSubLesson, api, notify]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    setSelectedSubLesson("");
    setSubLessons([]);
    if (selectedLesson) loadSubLessons();
  }, [selectedLesson, loadSubLessons]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

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
        courseId: "10",
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
    [selectedSubLesson, editing, api, notify, loadQuestions]
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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
      }}
    >
      <QuestionsHeader
        lessons={lessons}
        selectedLesson={selectedLesson}
        subLessons={subLessons}
        selectedSubLesson={selectedSubLesson}
        onLessonChange={handleLessonChange}
        onSubLessonChange={handleSubLessonChange}
        onAddClick={handleAddClick}
        onImportClick={handleOpenImport} // [NEW]
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
        onSuccess={handleImportSuccess}
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
