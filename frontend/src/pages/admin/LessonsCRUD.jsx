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
import AdminPageCard from "../../components/admin/AdminPageCard";

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
    <AdminPageCard>
      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1.5}
          mb={2}
        >
          <Typography variant="h5">Quản lý Bài học</Typography>

          <Stack direction="row" gap={1} justifyContent="flex-end">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Hiển thị</InputLabel>
              <Select
                label="Hiển thị"
                value={filterDisplay}
                onChange={(e) => setFilterDisplay(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="true">Đang hiển thị</MenuItem>
                <MenuItem value="false">Đang ẩn</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" onClick={openCreate}>
              Thêm bài học
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lesson ID</TableCell>
                  <TableCell>Course ID</TableCell>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell width={90}>Thứ tự</TableCell>
                  <TableCell width={110}>Chế độ</TableCell>
                  <TableCell width={110} align="center">
                    Hiển thị
                  </TableCell>
                  <TableCell width={140} align="right">
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredLessons.map((item) => (
                  <TableRow key={item.lessonId} hover>
                    <TableCell>{item.lessonId}</TableCell>
                    <TableCell>{item.courseId}</TableCell>
                    <TableCell>{item.title}</TableCell>
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
                      <IconButton onClick={() => openEdit(item)}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(item)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredLessons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Không có bài học nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editing ? "Chỉnh sửa bài học" : "Thêm bài học"}
          </DialogTitle>

          <DialogContent dividers>
            <Box
              sx={{
                mt: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
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
          <Alert
            severity={snack.severity}
            onClose={closeSnack}
            variant="filled"
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminPageCard>
  );
}
