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

export default function LessonsCRUD() {
  const api = useAdminAPI();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    lessonId: "",
    courseId: "",
    title: "",
    description: "",
    order: 1,
    mode: "group", // group, auto, simple
  });

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = (msg, severity = "success") =>
    setSnack({ open: true, message: msg, severity });

  const closeSnack = () => setSnack((prev) => ({ ...prev, open: false }));

  /* ============================ LOAD ============================ */
  const loadLessons = async () => {
    try {
      setLoading(true);

      const res = await api.getLessonsByCourse("10"); // TẠM → lọc theo courseId=10
      // HOẶC load tất cả bài học của DB bằng cách tạo route BE riêng
      setLessons(res.data);
    } catch (err) {
      showMessage("Lỗi tải bài học", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  /* ============================ FORM HANDLER ============================ */
  const openCreate = () => {
    setEditing(null);
    setForm({
      lessonId: "",
      courseId: "",
      title: "",
      description: "",
      order: 1,
      mode: "group",
    });
    setOpenDialog(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      lessonId: item.lessonId || "",
      courseId: item.courseId || "",
      title: item.title || "",
      description: item.description || "",
      order: item.order || 1,
      mode: item.mode || "group",
    });
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
      loadLessons();
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
      loadLessons();
    } catch {
      showMessage("Lỗi xóa bài học", "error");
    }
  };

  /* ============================ RENDER ============================ */
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Quản lý Bài học</Typography>
        <Button variant="contained" onClick={openCreate}>
          Thêm bài học
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Lesson ID</TableCell>
              <TableCell>Course ID</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Thứ tự</TableCell>
              <TableCell>Chế độ</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {lessons.map((item) => (
              <TableRow key={item.lessonId}>
                <TableCell>{item.lessonId}</TableCell>
                <TableCell>{item.courseId}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.order}</TableCell>
                <TableCell>{item.mode}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(item)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(item)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {lessons.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có bài học nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Chỉnh sửa bài học" : "Thêm bài học"}</DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Lesson ID"
              value={form.lessonId}
              onChange={(e) => changeForm("lessonId", e.target.value)}
              fullWidth
              disabled={!!editing}
            />

            <TextField
              label="Course ID"
              value={form.courseId}
              onChange={(e) => changeForm("courseId", e.target.value)}
              fullWidth
            />

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
              onChange={(e) => changeForm("order", Number(e.target.value))}
              fullWidth
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
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
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
