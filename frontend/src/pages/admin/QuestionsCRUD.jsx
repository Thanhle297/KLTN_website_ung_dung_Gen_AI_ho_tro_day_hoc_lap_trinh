import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";

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

  const [form, setForm] = useState({
    question: "",
    ex: [{ input: "", output: "" }],
    testcase: [{ input: [""], expected: "" }],
    topic: "",
    courseId: "10",
  });

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (msg, severity = "success") =>
    setSnack({ open: true, message: msg, severity });

  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  /* ================= LOAD LESSON ================= */
  const loadLessons = async () => {
    try {
      const res = await api.getLessonsByCourse("10");
      setLessons(res.data);
    } catch {
      notify("Lỗi tải bài học", "error");
    }
  };

  /* ================= LOAD SUBLESSON ================= */
  const loadSubLessons = async () => {
    if (!selectedLesson) return;

    try {
      const res = await api.getSubLessons(selectedLesson);
      setSubLessons(res.data);
    } catch {
      notify("Lỗi tải SubLesson", "error");
    }
  };

  /* ================= LOAD QUESTIONS ================= */
  const loadQuestions = async () => {
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
  };

  useEffect(() => {
    loadLessons();
  }, []);

  useEffect(() => {
    setSelectedSubLesson("");
    setSubLessons([]);
    if (selectedLesson) loadSubLessons();
  }, [selectedLesson]);

  useEffect(() => {
    loadQuestions();
  }, [selectedSubLesson]);

  /* ================= FORM ================= */
  const changeForm = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const openCreate = () => {
    setEditing(null);
    setForm({
      question: "",
      ex: [{ input: "", output: "" }],
      testcase: [{ input: [""], expected: "" }],
      topic: "",
      courseId: "10",
    });
    setOpenDialog(true);
  };

  const openEdit = (q) => {
    setEditing(q);
    setForm({
      question: q.question,
      ex: q.ex || [{ input: "", output: "" }],
      testcase: q.testcase || [{ input: [""], expected: "" }],
      topic: q.topic || "",
      courseId: q.courseId || "10",
    });
    setOpenDialog(true);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!selectedSubLesson || !form.question) {
      notify("Thiếu dữ liệu bắt buộc", "warning");
      return;
    }

    const topicId = selectedSubLesson.replace("bai", "").split("_")[0];

    const payload = {
      ...form,
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
  };

  /* ================= DELETE ================= */
  const handleDelete = async (q) => {
    if (!window.confirm(`Xóa câu hỏi ID ${q.id}?`)) return;

    try {
      await api.deleteQuestion(q.id);
      notify("Xóa thành công");
      loadQuestions();
    } catch {
      notify("Lỗi xóa câu hỏi", "error");
    }
  };

  /* ================= RENDER UI ================= */
  return (
    <Box>
      <Typography variant="h5" mb={2}>
        Quản lý Câu hỏi
      </Typography>

      {/* Chọn Lesson */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Chọn Bài</InputLabel>
        <Select
          label="Chọn Bài"
          value={selectedLesson}
          onChange={(e) => setSelectedLesson(e.target.value)}
        >
          {lessons.map((l) => (
            <MenuItem key={l.lessonId} value={l.lessonId}>
              {l.lessonId} — {l.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Chọn SubLesson */}
      {selectedLesson && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Chọn SubLesson</InputLabel>
          <Select
            label="Chọn SubLesson"
            value={selectedSubLesson}
            onChange={(e) => setSelectedSubLesson(e.target.value)}
          >
            {subLessons.map((s) => (
              <MenuItem key={s.lessonId} value={s.lessonId}>
                {s.lessonId} — {s.displayId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedSubLesson && (
        <Stack direction="row" justifyContent="flex-end" mb={2}>
          <Button variant="contained" onClick={openCreate}>
            Thêm câu hỏi
          </Button>
        </Stack>
      )}

      {!selectedSubLesson ? (
        <Typography>Hãy chọn SubLesson để xem câu hỏi</Typography>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Câu hỏi</TableCell>
              <TableCell>EX</TableCell>
              <TableCell>Testcase</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {questions.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.id}</TableCell>
                <TableCell>{q.question}</TableCell>
                <TableCell>{q.ex?.length || 0}</TableCell>
                <TableCell>{q.testcase?.length || 0}</TableCell>
                <TableCell>{q.topic}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(q)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(q)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có câu hỏi nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}</DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

            {/* CÂU HỎI */}
            <TextField
              label="Câu hỏi"
              value={form.question}
              onChange={(e) => changeForm("question", e.target.value)}
              fullWidth
              multiline
            />

            {/* EXAMPLES */}
            <Box>
              <Typography variant="subtitle1">Ví dụ (ex)</Typography>

              {form.ex.map((item, index) => (
                <Box key={index} sx={{ display: "flex", gap: 2, mb: 1 }}>
                  <TextField
                    label="Input"
                    value={item.input}
                    onChange={(e) => {
                      const updated = [...form.ex];
                      updated[index].input = e.target.value;
                      changeForm("ex", updated);
                    }}
                    fullWidth
                  />

                  <TextField
                    label="Output"
                    value={item.output}
                    onChange={(e) => {
                      const updated = [...form.ex];
                      updated[index].output = e.target.value;
                      changeForm("ex", updated);
                    }}
                    fullWidth
                  />
                </Box>
              ))}

              <Button
                onClick={() =>
                  changeForm("ex", [...form.ex, { input: "", output: "" }])
                }
              >
                + Thêm ví dụ
              </Button>
            </Box>

            {/* TESTCASE */}
            <Box>
              <Typography variant="subtitle1">Testcase</Typography>

              {form.testcase.map((item, index) => (
                <Box key={index} sx={{ display: "flex", gap: 2, mb: 1 }}>
                  <TextField
                    label="Input"
                    value={item.input[0]}
                    onChange={(e) => {
                      const updated = [...form.testcase];
                      updated[index].input = [e.target.value];
                      changeForm("testcase", updated);
                    }}
                    fullWidth
                  />

                  <TextField
                    label="Expected"
                    value={item.expected}
                    onChange={(e) => {
                      const updated = [...form.testcase];
                      updated[index].expected = e.target.value;
                      changeForm("testcase", updated);
                    }}
                    fullWidth
                  />
                </Box>
              ))}

              <Button
                onClick={() =>
                  changeForm("testcase", [
                    ...form.testcase,
                    { input: [""], expected: "" },
                  ])
                }
              >
                + Thêm testcase
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

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
