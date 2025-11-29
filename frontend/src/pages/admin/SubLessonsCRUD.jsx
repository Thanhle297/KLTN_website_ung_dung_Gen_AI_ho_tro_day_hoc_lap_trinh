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
    <Box>
      <Typography variant="h5" mb={2}>
        Quản lý SubLesson
      </Typography>

      {/* Chọn bài lớn */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Chọn Bài học</InputLabel>
        <Select
          label="Chọn Bài học"
          value={selectedLesson}
          onChange={(e) => setSelectedLesson(e.target.value)}
        >
          {lessonList.map((l) => (
            <MenuItem key={l.lessonId} value={l.lessonId}>
              {l.lessonId} — {l.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedLesson && (
        <Stack direction="row" justifyContent="flex-end" mb={2}>
          <Button variant="contained" onClick={openCreate}>
            Thêm SubLesson
          </Button>
        </Stack>
      )}

      {!selectedLesson ? (
        <Typography>Hãy chọn một bài học để xem subLessons.</Typography>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Display ID</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Chế độ</TableCell>
              <TableCell>Hiển thị</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subLessons.map((s) => (
              <TableRow key={s.lessonId}>
                <TableCell>{s.lessonId}</TableCell>
                <TableCell>{s.displayId}</TableCell>
                <TableCell>{s.title}</TableCell>
                <TableCell>{s.description}</TableCell>
                <TableCell>{s.mode}</TableCell>
                <TableCell>{s.display ? "Có" : "Không"}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(s)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(s)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {subLessons.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Không có subLesson nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* DIALOG */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? "Chỉnh sửa SubLesson" : "Thêm SubLesson"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="SubLesson ID"
              value={form.lessonId}
              onChange={(e) => changeForm("lessonId", e.target.value)}
              disabled={!!editing}
              fullWidth
            />

            <TextField
              label="Display ID"
              value={form.displayId}
              onChange={(e) => changeForm("displayId", e.target.value)}
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
              multiline
              minRows={2}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Chế độ</InputLabel>
              <Select
                label="Chế độ"
                value={form.mode}
                onChange={(e) => changeForm("mode", e.target.value)}
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
              >
                <MenuItem value="true">Có</MenuItem>
                <MenuItem value="false">Không</MenuItem>
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
