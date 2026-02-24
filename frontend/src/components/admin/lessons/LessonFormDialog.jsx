import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  useTheme,
} from "@mui/material";

// Mapping lessonNumber -> tên bài trong SGK
const LESSON_NUMBER_OPTIONS = [
  { value: 16, label: "Bài 16 - Lệnh print" },
  { value: 17, label: "Bài 17 - Biến và lệnh gán" },
  { value: 18, label: "Bài 18 - Câu lệnh vào ra đơn giản" },
  { value: 19, label: "Bài 19 - Câu lệnh rẽ nhánh if" },
  { value: 20, label: "Bài 20 - Câu lệnh lặp for" },
  { value: 21, label: "Bài 21 - Câu lệnh lặp while" },
  { value: 22, label: "Bài 22 - Kiểu dữ liệu danh sách" },
  { value: 23, label: "Bài 23 - Lệnh làm việc với danh sách" },
  { value: 24, label: "Bài 24 - Xâu kí tự" },
  { value: 25, label: "Bài 25 - Lệnh làm việc với xâu kí tự" },
  { value: 26, label: "Bài 26 - Hàm trong Python" },
  { value: 27, label: "Bài 27 - Tham số của hàm" },
  { value: 28, label: "Bài 28 - Phạm vi của biến" },
];

const LessonFormDialog = ({
  open,
  editing,
  courses,
  onClose,
  onSave,
  defaultCourseId,
}) => {
  const theme = useTheme();

  const [form, setForm] = useState({
    lessonId: "",
    courseId: "",
    title: "",
    description: "",
    order: 1,
    mode: "group",
    display: true,
    lessonNumber: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        lessonId: editing.lessonId || "",
        courseId: editing.courseId || "",
        title: editing.title || "",
        description: editing.description || "",
        order: editing.order ?? 1,
        mode: editing.mode || "group",
        display: editing.display ?? true,
        lessonNumber: editing.lessonNumber ?? "",
      });
    } else {
      setForm({
        lessonId: "",
        courseId: defaultCourseId || "",
        title: "",
        description: "",
        order: 1,
        mode: "group",
        display: true,
        lessonNumber: "",
      });
    }
  }, [editing, open, defaultCourseId]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableRestoreFocus
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: theme.palette.background.paper,
          backdropFilter: "blur(10px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
          {/* Lesson ID chỉ hiển thị khi chỉnh sửa (backend tự sinh khi tạo mới) */}
          {editing && (
            <TextField
              label="Lesson ID"
              value={form.lessonId}
              fullWidth
              disabled
            />
          )}

          <FormControl fullWidth>
            <InputLabel>Khóa học</InputLabel>
            <Select
              label="Khóa học"
              value={form.courseId}
              onChange={(e) => handleChange("courseId", e.target.value)}
            >
              {courses.map((c) => (
                <MenuItem key={c.courseId} value={c.courseId}>
                  {c.title} ({c.courseId})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Số bài học (SGK)</InputLabel>
            <Select
              label="Số bài học (SGK)"
              value={form.lessonNumber}
              onChange={(e) => handleChange("lessonNumber", e.target.value)}
            >
              {LESSON_NUMBER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

          <TextField
            label="Thứ tự"
            type="number"
            value={form.order}
            onChange={(e) => {
              const v = e.target.value;
              handleChange("order", v === "" ? "" : Number(v));
            }}
            fullWidth
            inputProps={{ min: 1 }}
          />

          <FormControl fullWidth>
            <InputLabel>Chế độ</InputLabel>
            <Select
              label="Chế độ"
              value={form.mode}
              onChange={(e) => handleChange("mode", e.target.value)}
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
                onChange={(e) => handleChange("display", e.target.checked)}
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
          onClick={onClose}
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
          onClick={handleSubmit}
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
  );
};

export default LessonFormDialog;
