import React, { useEffect, useMemo, useState } from "react";
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
  Switch,
  FormControlLabel,
  Tooltip,
  TableContainer,
  Paper,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";

const DEFAULT_COURSE_ID = "10";

export default function LessonsCRUD() {
  const api = useAdminAPI();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [filterDisplay, setFilterDisplay] = useState("all"); // all | true | false

  const [form, setForm] = useState({
    lessonId: "",
    courseId: DEFAULT_COURSE_ID,
    title: "",
    description: "",
    order: 1,
    mode: "group", // group, auto, simple
    display: true, // ✅ ẩn/hiện
  });

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = (msg, severity = "success") =>
    setSnack({ open: true, message: msg, severity });

  const closeSnack = () => setSnack((prev) => ({ ...prev, open: false }));

  /* ============================ LOAD LESSONS ============================ */
  const loadLessons = async () => {
    try {
      setLoading(true);
      const res = await api.getLessonsByCourse(DEFAULT_COURSE_ID);
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showMessage("Lỗi tải bài học", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ============================ LOAD COURSES ============================ */
  const loadCourses = async () => {
    try {
      const res = await api.getCourses();
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      showMessage("Không thể tải danh sách khóa học", "error");
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  /* ============================ FILTERED LIST ============================ */
  const filteredLessons = useMemo(() => {
    return lessons
      .filter((l) => {
        if (filterDisplay === "all") return true;
        return String(!!l.display) === filterDisplay;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [lessons, filterDisplay]);

  /* ============================ FORM HANDLER ============================ */
  const openCreate = async () => {
    setEditing(null);
    setForm({
      lessonId: "",
      courseId: DEFAULT_COURSE_ID,
      title: "",
      description: "",
      order: 1,
      mode: "group",
      display: true,
    });
    await loadCourses();
    setOpenDialog(true);
  };

  const openEdit = async (item) => {
    setEditing(item);
    setForm({
      lessonId: item.lessonId || "",
      courseId: item.courseId || DEFAULT_COURSE_ID,
      title: item.title || "",
      description: item.description || "",
      order: item.order ?? 1,
      mode: item.mode || "group",
      display: item.display ?? true,
    });
    await loadCourses();
    setOpenDialog(true);
  };

  const changeForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ============================ SAVE ============================ */
  const handleSave = async () => {
    if (!form.lessonId || !form.courseId || !form.title) {
      showMessage("lessonId, courseId và title là bắt buộc", "warning");
      return;
    }

    try {
      if (editing) {
        await api.updateLesson(form.lessonId, form);
        showMessage("Cập nhật bài học thành công");
      } else {
        await api.createLesson(form);
        showMessage("Thêm bài học thành công");
      }

      setOpenDialog(false);
      await loadLessons();
    } catch {
      showMessage("Lỗi lưu bài học", "error");
    }
  };

  /* ============================ DELETE ============================ */
  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa bài: ${item.title}?`)) return;

    try {
      await api.deleteLesson(item.lessonId);
      showMessage("Xóa thành công");
      await loadLessons();
    } catch {
      showMessage("Lỗi xóa bài học", "error");
    }
  };

  /* ============================ TOGGLE DISPLAY (TABLE) ============================ */
  const handleToggleDisplay = async (item, next) => {
    try {
      await api.updateLesson(item.lessonId, {
        ...item,
        display: next,
      });
      showMessage(next ? "Đã hiển thị bài học" : "Đã ẩn bài học");
      await loadLessons();
    } catch {
      showMessage("Lỗi cập nhật trạng thái hiển thị", "error");
    }
  };

  /* ============================ RENDER ============================ */
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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            📚 Quản lý Bài học
          </Typography>

          <Stack direction="row" gap={1.5} justifyContent="flex-end">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Hiển thị</InputLabel>
              <Select
                label="Hiển thị"
                value={filterDisplay}
                onChange={(e) => setFilterDisplay(e.target.value)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: "white",
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="true">Đang hiển thị</MenuItem>
                <MenuItem value="false">Đang ẩn</MenuItem>
              </Select>
            </FormControl>

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
              Thêm bài học
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Lessons Table */}
      {loading ? (
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
                    Lesson ID
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Course ID
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
                    width={90}
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Thứ tự
                  </TableCell>
                  <TableCell
                    width={110}
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Chế độ
                  </TableCell>
                  <TableCell
                    width={110}
                    align="center"
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Hiển thị
                  </TableCell>
                  <TableCell
                    width={140}
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
                {filteredLessons.map((item) => (
                  <TableRow
                    key={item.lessonId}
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
                    <TableCell sx={{ fontWeight: 600 }}>
                      {item.lessonId}
                    </TableCell>
                    <TableCell>{item.courseId}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{item.title}</TableCell>
                    <TableCell>{item.order}</TableCell>
                    <TableCell>{item.mode}</TableCell>

                    <TableCell align="center">
                      <Tooltip
                        title={item.display ? "Ẩn bài học" : "Hiện bài học"}
                      >
                        <Switch
                          checked={!!item.display}
                          onChange={(e) =>
                            handleToggleDisplay(item, e.target.checked)
                          }
                          color="success"
                        />
                      </Tooltip>
                    </TableCell>

                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          onClick={() => openEdit(item)}
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
                          onClick={() => handleDelete(item)}
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

                {filteredLessons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography variant="h6" color="text.secondary">
                        😔 Không có bài học nào
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
        maxWidth="sm"
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
          {editing ? "✏️ Chỉnh sửa bài học" : "➕ Thêm bài học"}
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            <TextField
              label="Lesson ID"
              value={form.lessonId}
              onChange={(e) => changeForm("lessonId", e.target.value)}
              fullWidth
              disabled={!!editing}
            />

            <FormControl fullWidth>
              <InputLabel>Khóa học</InputLabel>
              <Select
                label="Khóa học"
                value={form.courseId}
                onChange={(e) => changeForm("courseId", e.target.value)}
              >
                {courses.map((c) => (
                  <MenuItem key={c.courseId} value={c.courseId}>
                    {c.title} ({c.courseId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Tiêu đề"
              value={form.title}
              onChange={(e) => changeForm("title", e.target.value)}
              fullWidth
            />

            <TextField
              label="Mô tả"
              value={form.description}
              onChange={(e) => changeForm("description", e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Thứ tự"
              type="number"
              value={form.order}
              onChange={(e) => {
                const v = e.target.value;
                changeForm("order", v === "" ? "" : Number(v));
              }}
              fullWidth
              inputProps={{ min: 1 }}
            />

            <FormControl fullWidth>
              <InputLabel>Chế độ</InputLabel>
              <Select
                label="Chế độ"
                value={form.mode}
                onChange={(e) => changeForm("mode", e.target.value)}
              >
                <MenuItem value="group">group</MenuItem>
                <MenuItem value="auto">auto</MenuItem>
                <MenuItem value="simple">simple</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={!!form.display}
                  onChange={(e) => changeForm("display", e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography fontWeight={500}>
                  {form.display ? "Hiển thị bài học" : "Ẩn bài học"}
                </Typography>
              }
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

      {/* snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} onClose={closeSnack} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
