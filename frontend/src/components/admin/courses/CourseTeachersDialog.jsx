// src/components/admin/courses/CourseTeachersDialog.jsx
// Dialog quản lý giáo viên của một khóa học
// Cho phép thêm/xóa giáo viên nhanh chóng

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Autocomplete,
  TextField,
  CircularProgress,
  Chip,
  Divider,
  useTheme,
} from "@mui/material";
import {
  School,
  Delete,
  PersonAdd,
  Close,
} from "@mui/icons-material";
import useAdminAPI from "../../../hook/useAdminAPI";

/**
 * Dialog quản lý giáo viên của khóa học
 * @param {boolean} open - Dialog visibility
 * @param {object} course - Course object { courseId, title }
 * @param {function} onClose - Close handler
 * @param {function} onTeachersChanged - Callback khi danh sách giáo viên thay đổi
 */
export default function CourseTeachersDialog({
  open,
  course,
  onClose,
  onTeachersChanged,
}) {
  const api = useAdminAPI();
  const theme = useTheme();

  const [teachers, setTeachers] = useState([]); // Tất cả teachers
  const [courseTeachers, setCourseTeachers] = useState([]); // Teachers của course
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load danh sách teachers và teachers của course
  const loadData = useCallback(async () => {
    if (!course?.courseId) return;

    try {
      setLoading(true);

      // Load song song
      const [allTeachersRes, courseTeachersRes] = await Promise.all([
        api.getTeachers(),
        api.getCourseTeachers(course.courseId),
      ]);

      setTeachers(allTeachersRes.data);
      setCourseTeachers(courseTeachersRes.data);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  }, [course?.courseId, api]);

  useEffect(() => {
    if (open && course) {
      loadData();
    }
  }, [open, course, loadData]);

  // Thêm giáo viên
  const handleAddTeacher = useCallback(async () => {
    if (!selectedTeacher || !course?.courseId) return;

    try {
      setSaving(true);
      await api.addCourseTeacher(course.courseId, selectedTeacher._id);

      // Refresh danh sách
      const res = await api.getCourseTeachers(course.courseId);
      setCourseTeachers(res.data);
      setSelectedTeacher(null);

      if (onTeachersChanged) onTeachersChanged();
    } catch (err) {
      console.error("❌ Lỗi thêm giáo viên:", err);
      alert("Lỗi khi thêm giáo viên: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }, [selectedTeacher, course?.courseId, api, onTeachersChanged]);

  // Xóa giáo viên
  const handleRemoveTeacher = useCallback(
    async (teacherId) => {
      if (!course?.courseId) return;

      try {
        setSaving(true);
        await api.removeCourseTeacher(course.courseId, teacherId);

        // Refresh danh sách
        const res = await api.getCourseTeachers(course.courseId);
        setCourseTeachers(res.data);

        if (onTeachersChanged) onTeachersChanged();
      } catch (err) {
        console.error("❌ Lỗi xóa giáo viên:", err);
        alert("Lỗi khi xóa giáo viên: " + (err.message || "Unknown error"));
      } finally {
        setSaving(false);
      }
    },
    [course?.courseId, api, onTeachersChanged]
  );

  if (!course) return null;

  // Lọc ra teachers chưa được gán
  const availableTeachers = teachers.filter(
    (t) => !courseTeachers.some((ct) => ct._id === t._id)
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          minHeight: "500px",
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
          fontSize: "1.3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <School />
          <span>Quản lý giáo viên - {course.title}</span>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Thêm giáo viên */}
            <Box sx={{
              p: 2,
              background: theme.palette.mode === "dark"
                ? theme.palette.background.default
                : "#f8f9fa",
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Thêm giáo viên
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Autocomplete
                  options={availableTeachers}
                  value={selectedTeacher}
                  onChange={(e, newValue) => setSelectedTeacher(newValue)}
                  getOptionLabel={(option) =>
                    `${option.fullname || option.username} (${option.username})`
                  }
                  isOptionEqualToValue={(option, value) =>
                    option._id === value._id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Tìm kiếm giáo viên..."
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                  sx={{ flex: 1 }}
                  disabled={saving}
                />
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={handleAddTeacher}
                  disabled={!selectedTeacher || saving}
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 2,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    "&:hover": {
                      background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                    },
                  }}
                >
                  Thêm
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* Danh sách giáo viên hiện tại */}
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Giáo viên hiện tại ({courseTeachers.length})
              </Typography>

              {courseTeachers.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: "text.secondary",
                  }}
                >
                  <School sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">
                    Chưa có giáo viên nào được gán cho khóa học này
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {courseTeachers.map((teacher) => (
                    <ListItem
                      key={teacher._id}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        mb: 1,
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.04)",
                        },
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveTeacher(teacher._id)}
                          disabled={saving}
                          sx={{
                            background:
                              "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                            color: "white",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          }}
                        >
                          <School />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={600}>
                            {teacher.fullname || teacher.username}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                            <Chip
                              label={teacher.username}
                              size="small"
                              sx={{
                                fontSize: "0.75rem",
                                height: 20,
                              }}
                            />
                            {teacher.email && (
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary", alignSelf: "center" }}
                              >
                                {teacher.email}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{
        p: 2,
        background: theme.palette.mode === "dark"
          ? theme.palette.background.default
          : "#f8f9fa",
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
