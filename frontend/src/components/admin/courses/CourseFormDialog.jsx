import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Autocomplete,
  Chip,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { School } from "@mui/icons-material";
import useAdminAPI from "../../../hook/useAdminAPI";

const CourseFormDialog = ({ open, editing, onClose, onSave }) => {
  const api = useAdminAPI();
  const theme = useTheme();

  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
    teacherIds: [],
  });

  const [teachers, setTeachers] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Load danh sách teachers khi dialog mở
  useEffect(() => {
    const loadTeachers = async () => {
      if (!open) return;

      try {
        setLoadingTeachers(true);
        const res = await api.getTeachers();
        setTeachers(res.data);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách giáo viên:", err);
      } finally {
        setLoadingTeachers(false);
      }
    };

    loadTeachers();
  }, [open, api]);

  // Load dữ liệu course và teachers đã gán
  useEffect(() => {
    const loadData = async () => {
      if (editing) {
        // Nếu đang edit, load teachers của course
        try {
          const res = await api.getCourseTeachers(editing.courseId);
          const courseTeachers = res.data;

          setForm({
            courseId: editing.courseId,
            title: editing.title,
            description: editing.description,
            teacherIds: courseTeachers.map((t) => t._id),
          });

          setSelectedTeachers(courseTeachers);
        } catch (err) {
          console.error("❌ Lỗi tải giáo viên của khóa học:", err);
          // Fallback nếu lỗi
          setForm({
            courseId: editing.courseId,
            title: editing.title,
            description: editing.description,
            teacherIds: editing.teacherIds || [],
          });
          setSelectedTeachers([]);
        }
      } else {
        // Reset form khi tạo mới
        setForm({
          courseId: "",
          title: "",
          description: "",
          teacherIds: [],
        });
        setSelectedTeachers([]);
      }
    };

    if (open) {
      loadData();
    }
  }, [editing, open, api]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTeachersChange = useCallback((event, newValue) => {
    setSelectedTeachers(newValue);
    setForm((prev) => ({
      ...prev,
      teacherIds: newValue.map((t) => t._id),
    }));
  }, []);

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          background: theme.palette.gradient.primary,
          color: "white",
          fontWeight: 700,
          fontSize: "1.5rem",
        }}
      >
        {editing ? "✏️ Chỉnh sửa khóa học" : "➕ Thêm khóa học"}
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Course ID chỉ hiển thị khi chỉnh sửa (backend tự sinh khi tạo mới) */}
          {editing && (
            <TextField
              label="Course ID"
              value={form.courseId}
              fullWidth
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          )}
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
            fullWidth
            multiline
            minRows={2}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          {/* Autocomplete multi-select cho teachers */}
          <Autocomplete
            multiple
            options={teachers}
            value={selectedTeachers}
            onChange={handleTeachersChange}
            getOptionLabel={(option) =>
              `${option.fullname || option.username} (${option.username})`
            }
            isOptionEqualToValue={(option, value) =>
              option._id === value._id
            }
            loading={loadingTeachers}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Giáo viên"
                placeholder="Chọn giáo viên..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <School sx={{ ml: 1, mr: 0.5, color: "action.active" }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {loadingTeachers ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option._id}
                  label={option.fullname || option.username}
                  size="small"
                  sx={{
                    background: "rgba(102, 126, 234, 0.1)",
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }}
                />
              ))
            }
            sx={{
              "& .MuiAutocomplete-tag": {
                margin: "2px",
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
          onClick={handleSubmit}
          variant="contained"
          sx={{
            background: theme.palette.gradient.primary,
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            "&:hover": {
              background: theme.palette.gradient.primaryHover,
            },
          }}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseFormDialog;
