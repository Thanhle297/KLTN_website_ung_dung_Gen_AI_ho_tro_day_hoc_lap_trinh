import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import { School as SchoolIcon } from "@mui/icons-material";

export default function UserCoursesDialog({
  open,
  user,
  onClose,
  onSave,
  api,
}) {
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Lấy tất cả courses
      const coursesRes = await api.getCourses();
      setAllCourses(coursesRes.data);

      // Lấy courses hiện tại của user
      const userCoursesRes = await api.getUserCourses(user._id);
      const userCourseIds = userCoursesRes.data.map((c) => c.courseId);
      setSelectedCourses(userCourseIds);
    } catch (error) {
      console.error("❌ Load courses error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Lấy courses hiện tại của user
      const userCoursesRes = await api.getUserCourses(user._id);
      const currentCourseIds = userCoursesRes.data.map((c) => c.courseId);

      // Tìm courses cần thêm và cần xóa
      const toEnroll = selectedCourses.filter(
        (id) => !currentCourseIds.includes(id)
      );
      const toUnenroll = currentCourseIds.filter(
        (id) => !selectedCourses.includes(id)
      );

      // Enroll courses mới
      for (const courseId of toEnroll) {
        await api.enrollUserToCourse(user._id, courseId);
      }

      // Unenroll courses cũ
      for (const courseId of toUnenroll) {
        await api.unenrollUserFromCourse(user._id, courseId);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("❌ Save courses error:", error);
      alert("Lỗi khi lưu: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <SchoolIcon />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Quản lý khóa học
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {user.fullname} ({user.username})
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
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
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`${selectedCourses.length} / ${allCourses.length} khóa học`}
                color="primary"
                size="small"
              />
            </Box>

            <FormGroup>
              {allCourses.map((course) => (
                <FormControlLabel
                  key={course.courseId}
                  control={
                    <Checkbox
                      checked={selectedCourses.includes(course.courseId)}
                      onChange={() => handleToggleCourse(course.courseId)}
                      sx={{
                        color: "#667eea",
                        "&.Mui-checked": {
                          color: "#667eea",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {course.title}
                      </Typography>
                      {course.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.85rem" }}
                        >
                          {course.description}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: selectedCourses.includes(course.courseId)
                      ? "#667eea"
                      : "#e0e0e0",
                    backgroundColor: selectedCourses.includes(course.courseId)
                      ? "rgba(102, 126, 234, 0.05)"
                      : "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(102, 126, 234, 0.08)",
                      borderColor: "#667eea",
                    },
                  }}
                />
              ))}
            </FormGroup>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={saving}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
            },
          }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
