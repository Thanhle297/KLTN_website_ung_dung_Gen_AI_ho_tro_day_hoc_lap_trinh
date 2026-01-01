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
  FormControlLabel,
  Switch,
  Paper,
  TableContainer,
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
    echo_input: false, // NEW FIELD
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
      echo_input: false,
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
      echo_input: q.echo_input ?? false, // LOAD echo_input
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
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: 4,
          p: 3,
          mb: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 3,
          }}
        >
          ❓ Quản lý Câu hỏi
        </Typography>

        {/* Chọn Lesson */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Chọn Bài</InputLabel>
          <Select
            label="Chọn Bài"
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            sx={{
              borderRadius: 2,
              backgroundColor: "white",
            }}
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
              sx={{
                borderRadius: 2,
                backgroundColor: "white",
              }}
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
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={openCreate}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                px: 3,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Thêm câu hỏi
            </Button>
          </Stack>
        )}
      </Box>

      {!selectedSubLesson ? (
        <Paper
          sx={{
            borderRadius: 4,
            p: 8,
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h6" color="text.secondary">
            📚 Hãy chọn SubLesson để xem câu hỏi
          </Typography>
        </Paper>
      ) : loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress
            size={60}
            sx={{
              color: "white",
            }}
          />
        </Box>
      ) : (
        <Paper
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      py: 2,
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Câu hỏi
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    EX
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Testcase
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Echo Input
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Topic
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {questions.map((q) => (
                  <TableRow
                    key={q.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f7fafc",
                        transform: "scale(1.01)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                      },
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{q.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{q.question}</TableCell>
                    <TableCell>{q.ex?.length || 0}</TableCell>
                    <TableCell>{q.testcase?.length || 0}</TableCell>
                    <TableCell>{q.echo_input ? "Có" : "Không"}</TableCell>
                    <TableCell sx={{ color: "#4a5568" }}>{q.topic}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          onClick={() => openEdit(q)}
                          sx={{
                            background:
                              "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            color: "white",
                            width: 36,
                            height: 36,
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                          size="small"
                        >
                          <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(q)}
                          sx={{
                            background:
                              "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                            color: "white",
                            width: 36,
                            height: 36,
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                          size="small"
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {questions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography variant="h6" color="text.secondary">
                        😔 Không có câu hỏi nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: "1.5rem",
          }}
        >
          {editing ? "✏️ Chỉnh sửa câu hỏi" : "➕ Thêm câu hỏi"}
        </DialogTitle>

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

            {/* echo_input SWITCH */}
            <FormControlLabel
              control={
                <Switch
                  checked={form.echo_input}
                  onChange={(e) => changeForm("echo_input", e.target.checked)}
                />
              }
              label="In lại input khi chạy (echo_input)"
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
                    multiline
                    minRows={2}
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
                    multiline
                    minRows={2}
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
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Testcase (mỗi dòng là một input)
              </Typography>

              {form.testcase.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mb: 2,
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                  }}
                >
                  <TextField
                    label="Input (nhiều dòng)"
                    value={(item.input || []).join("\n")}
                    onChange={(e) => {
                      const updated = [...form.testcase];
                      updated[index].input = e.target.value.split("\n");
                      changeForm("testcase", updated);
                    }}
                    fullWidth
                    multiline
                    minRows={3}
                  />

                  <TextField
                    label="Expected Output"
                    value={item.expected}
                    onChange={(e) => {
                      const updated = [...form.testcase];
                      updated[index].expected = e.target.value;
                      changeForm("testcase", updated);
                    }}
                    fullWidth
                    multiline
                  />

                  <Button
                    color="error"
                    onClick={() => {
                      const updated = form.testcase.filter(
                        (_, i) => i !== index
                      );
                      changeForm("testcase", updated);
                    }}
                    sx={{ alignSelf: "flex-end" }}
                  >
                    Xóa testcase
                  </Button>
                </Box>
              ))}

              <Button
                variant="outlined"
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
