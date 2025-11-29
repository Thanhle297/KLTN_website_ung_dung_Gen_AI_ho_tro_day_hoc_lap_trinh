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
  Paper,
  TableContainer,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { Edit, Delete } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";

export default function CoursesCRUD() {
  const api = useAdminAPI();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
  });

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = (msg, severity = "success") =>
    setSnack({ open: true, message: msg, severity });

  const handleCloseSnack = () => setSnack((prev) => ({ ...prev, open: false }));

  /* ==================== LOAD ==================== */
  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      setCourses(res.data);
    } catch (err) {
      showMessage("Lỗi tải khóa học", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  /* ==================== FORM ==================== */
  const openCreate = () => {
    setEditing(null);
    setForm({
      courseId: "",
      title: "",
      description: "",
    });
    setOpenDialog(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      courseId: item.courseId,
      title: item.title,
      description: item.description,
    });
    setOpenDialog(true);
  };

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ==================== SAVE ==================== */
  const handleSave = async () => {
    try {
      if (!form.courseId || !form.title) {
        showMessage("courseId và title là bắt buộc", "warning");
        return;
      }

      if (editing) {
        await api.updateCourse(editing.courseId, form);
        showMessage("Cập nhật khóa học thành công");
      } else {
        await api.createCourse(form);
        showMessage("Thêm khóa học thành công");
      }

      setOpenDialog(false);
      loadCourses();
    } catch {
      showMessage("Lỗi lưu khóa học", "error");
    }
  };

  /* ==================== DELETE ==================== */
  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa khóa học: ${item.title}`)) return;

    try {
      await api.deleteCourse(item.courseId);
      showMessage("Xóa thành công");
      loadCourses();
    } catch {
      showMessage("Lỗi xóa khóa học", "error");
    }
  };

  /* ==================== RENDER ==================== */
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h5" fontWeight="bold" color="primary">
            Quản lý Khóa học
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreate}
            sx={{ borderRadius: 20, textTransform: "none", px: 3 }}
          >
            Thêm khóa học
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3, p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Tiêu đề</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Mô tả</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.courseId} hover>
                    <TableCell>{c.courseId}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{c.title}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 300,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.description}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => openEdit(c)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(c)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        Không có khóa học nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle>
          {editing ? "Chỉnh sửa khóa học" : "Thêm khóa học"}
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Course ID"
              value={form.courseId}
              onChange={(e) => handleChange("courseId", e.target.value)}
              fullWidth
              disabled={!!editing}
            />
            <TextField
              label="Tiêu đề"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              fullWidth
            />
            <TextField
              label="Mô tả"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: 2 }}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnack}
          severity={snack.severity}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
