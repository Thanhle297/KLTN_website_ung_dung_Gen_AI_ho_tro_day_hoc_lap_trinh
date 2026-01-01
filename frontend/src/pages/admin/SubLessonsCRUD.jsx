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
  Paper,
  TableContainer,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";

export default function SubLessonsCRUD() {
  const api = useAdminAPI();

  const [lessonList, setLessonList] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState("");

  const [subLessons, setSubLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    lessonId: "",
    displayId: "",
    title: "",
    description: "",
    mode: "auto",
    display: true,
    requiredProgress: 70,
  });

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (msg, severity = "success") =>
    setSnack({ open: true, message: msg, severity });

  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  /* ------- LOAD danh sách bài lớn ------- */
  const loadLessons = async () => {
    try {
      const res = await api.getLessonsByCourse("10"); // tùy course
      setLessonList(res.data);
    } catch {
      notify("Lỗi tải danh sách bài học", "error");
    }
  };

  /* ------- LOAD subLessons theo bài ------- */
  const loadSubLessons = async () => {
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
  };

  useEffect(() => {
    loadLessons();
  }, []);

  useEffect(() => {
    loadSubLessons();
  }, [selectedLesson]);

  /* ------- FORM ------- */
  const openCreate = () => {
    setEditing(null);
    setForm({
      lessonId: "",
      displayId: "",
      title: "",
      description: "",
      mode: "auto",
      display: true,
      requiredProgress: 70,
    });
    setOpenDialog(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      lessonId: item.lessonId,
      displayId: item.displayId,
      title: item.title,
      description: item.description,
      mode: item.mode,
      display: item.display,
      requiredProgress: item.requiredProgress ?? 70,
    });
    setOpenDialog(true);
  };

  const changeForm = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  /* ------- SAVE ------- */
  const handleSave = async () => {
    if (!selectedLesson || !form.lessonId || !form.title) {
      notify("Các trường lessonId, title là bắt buộc", "warning");
      return;
    }

    try {
      if (editing) {
        await api.updateSubLesson(selectedLesson, editing.lessonId, form);
        notify("Cập nhật thành công");
      } else {
        await api.createSubLesson(selectedLesson, form);
        notify("Thêm sublesson thành công");
      }
      setOpenDialog(false);
      loadSubLessons();
    } catch {
      notify("Lỗi lưu sublesson", "error");
    }
  };

  /* ------- DELETE ------- */
  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa subLesson: ${item.title}?`)) return;

    try {
      await api.deleteSubLesson(selectedLesson, item.lessonId);
      notify("Xóa thành công");
      loadSubLessons();
    } catch {
      notify("Lỗi xóa sublesson", "error");
    }
  };

  /* ------- RENDER ------- */
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
          📖 Quản lý SubLesson
        </Typography>

        {/* Chọn bài lớn */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Chọn Bài học</InputLabel>
          <Select
            label="Chọn Bài học"
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            sx={{
              borderRadius: 2,
              backgroundColor: "white",
            }}
          >
            {lessonList.map((l) => (
              <MenuItem key={l.lessonId} value={l.lessonId}>
                {l.lessonId} — {l.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedLesson && (
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
              Thêm SubLesson
            </Button>
          </Stack>
        )}
      </Box>

      {!selectedLesson ? (
        <Paper
          sx={{
            borderRadius: 4,
            p: 8,
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h6" color="text.secondary">
            📚 Hãy chọn một bài học để xem subLessons
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
                    Display ID
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Tiêu đề
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Mô tả
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Chế độ
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Hiển thị
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Điểm đạt %
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
                {subLessons.map((s) => (
                  <TableRow
                    key={s.lessonId}
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
                    <TableCell sx={{ fontWeight: 600 }}>{s.lessonId}</TableCell>
                    <TableCell>{s.displayId}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{s.title}</TableCell>
                    <TableCell sx={{ color: "#4a5568" }}>
                      {s.description}
                    </TableCell>
                    <TableCell>{s.mode}</TableCell>
                    <TableCell>{s.display ? "Có" : "Không"}</TableCell>
                    <TableCell align="center">
                      {s.requiredProgress ?? 70}%
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          onClick={() => openEdit(s)}
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
                          onClick={() => handleDelete(s)}
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
                {subLessons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="h6" color="text.secondary">
                        😔 Không có subLesson nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* DIALOG */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
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
          {editing ? "✏️ Chỉnh sửa SubLesson" : "➕ Thêm SubLesson"}
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="SubLesson ID"
              value={form.lessonId}
              onChange={(e) => changeForm("lessonId", e.target.value)}
              disabled={!!editing}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              label="Display ID"
              value={form.displayId}
              onChange={(e) => changeForm("displayId", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              label="Tiêu đề"
              value={form.title}
              onChange={(e) => changeForm("title", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              label="Mô tả"
              value={form.description}
              onChange={(e) => changeForm("description", e.target.value)}
              multiline
              minRows={2}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Chế độ</InputLabel>
              <Select
                label="Chế độ"
                value={form.mode}
                onChange={(e) => changeForm("mode", e.target.value)}
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="auto">auto</MenuItem>
                <MenuItem value="simple">simple</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Hiển thị</InputLabel>
              <Select
                label="Hiển thị"
                value={form.display}
                onChange={(e) =>
                  changeForm("display", e.target.value === "true")
                }
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="true">Có</MenuItem>
                <MenuItem value="false">Không</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Mức đạt yêu cầu (%)"
              type="number"
              value={form.requiredProgress}
              onChange={(e) =>
                changeForm("requiredProgress", Number(e.target.value))
              }
              helperText="Ví dụ: 60, 70, 80, 100"
              inputProps={{ min: 0, max: 100 }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
              },
            }}
          >
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
