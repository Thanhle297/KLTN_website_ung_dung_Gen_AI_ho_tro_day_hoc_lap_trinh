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
  useTheme,
} from "@mui/material";

const SubLessonFormDialog = ({ open, editing, onClose, onSave }) => {
  const theme = useTheme();

  const [form, setForm] = useState({
    lessonId: "",
    displayId: "",
    title: "",
    description: "",
    mode: "auto",
    display: true,
    requiredProgress: 70,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        lessonId: editing.lessonId,
        displayId: editing.displayId,
        title: editing.title,
        description: editing.description,
        mode: editing.mode,
        display: editing.display,
        requiredProgress: editing.requiredProgress ?? 70,
      });
    } else {
      setForm({
        lessonId: "",
        displayId: "",
        title: "",
        description: "",
        mode: "auto",
        display: true,
        requiredProgress: 70,
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
      disableRestoreFocus
      fullWidth
      maxWidth="sm"
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
        {editing ? "✏️ Chỉnh sửa SubLesson" : "➕ Thêm SubLesson"}
      </DialogTitle>
      <DialogContent sx={{ mt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* SubLesson ID chỉ hiển thị khi chỉnh sửa (backend tự sinh khi tạo mới) */}
          {editing && (
            <TextField
              label="SubLesson ID"
              value={form.lessonId}
              disabled
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          )}

          <TextField
            label="Display ID"
            value={form.displayId}
            onChange={(e) => handleChange("displayId", e.target.value)}
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
            onChange={(e) => handleChange("title", e.target.value)}
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
            onChange={(e) => handleChange("description", e.target.value)}
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
              onChange={(e) => handleChange("mode", e.target.value)}
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
                handleChange("display", e.target.value === "true")
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
              handleChange("requiredProgress", Number(e.target.value))
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

export default SubLessonFormDialog;
