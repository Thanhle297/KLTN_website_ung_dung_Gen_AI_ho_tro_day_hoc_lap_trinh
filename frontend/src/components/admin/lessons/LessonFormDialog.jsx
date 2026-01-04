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
} from "@mui/material";

const LessonFormDialog = ({ open, editing, courses, onClose, onSave }) => {
  const [form, setForm] = useState({
    lessonId: "",
    courseId: "10",
    title: "",
    description: "",
    order: 1,
    mode: "group",
    display: true,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        lessonId: editing.lessonId || "",
        courseId: editing.courseId || "10",
        title: editing.title || "",
        description: editing.description || "",
        order: editing.order ?? 1,
        mode: editing.mode || "group",
        display: editing.display ?? true,
      });
    } else {
      setForm({
        lessonId: "",
        courseId: "10",
        title: "",
        description: "",
        order: 1,
        mode: "group",
        display: true,
      });
    }
  }, [editing, open]);

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
            onChange={(e) => handleChange("lessonId", e.target.value)}
            fullWidth
            disabled={!!editing}
          />

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
