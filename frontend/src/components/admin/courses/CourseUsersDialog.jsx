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
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  People as PeopleIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

export default function CourseUsersDialog({
  open,
  course,
  onClose,
  onSave,
  api,
}) {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open && course) {
      loadData();
    }
  }, [open, course]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Lấy tất cả users (chỉ role = "user")
      const usersRes = await api.getUsers();
      const regularUsers = usersRes.data.filter((u) => u.role === "user");
      setAllUsers(regularUsers);

      // Lấy users hiện tại trong course
      const courseUsersRes = await api.getCourseUsers(course.courseId);
      const enrolledUserIds = courseUsersRes.data.map((u) => u._id);
      setSelectedUsers(enrolledUserIds);
    } catch (error) {
      console.error("❌ Load users error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Lấy users hiện tại trong course
      const courseUsersRes = await api.getCourseUsers(course.courseId);
      const currentUserIds = courseUsersRes.data.map((u) => u._id);

      // Tìm users cần thêm và cần xóa
      const toEnroll = selectedUsers.filter(
        (id) => !currentUserIds.includes(id)
      );
      const toUnenroll = currentUserIds.filter(
        (id) => !selectedUsers.includes(id)
      );

      // Enroll users mới
      for (const userId of toEnroll) {
        await api.enrollUserToCourse(userId, course.courseId);
      }

      // Unenroll users cũ
      for (const userId of toUnenroll) {
        await api.unenrollUserFromCourse(userId, course.courseId);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("❌ Save users error:", error);
      alert("Lỗi khi lưu: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (!course) return null;

  // Filter users theo search
  const filteredUsers = allUsers.filter(
    (user) =>
      user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <PeopleIcon />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Quản lý học sinh
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {course.title}
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
            <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
              <Chip
                label={`${selectedUsers.length} / ${allUsers.length} học sinh`}
                color="primary"
                size="small"
              />
              <TextField
                placeholder="Tìm kiếm..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
            </Box>

            <FormGroup sx={{ maxHeight: 400, overflowY: "auto" }}>
              {filteredUsers.map((user) => (
                <FormControlLabel
                  key={user._id}
                  control={
                    <Checkbox
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleToggleUser(user._id)}
                      sx={{
                        color: "#f093fb",
                        "&.Mui-checked": {
                          color: "#f5576c",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {user.fullname || user.username}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.85rem" }}
                      >
                        {user.username} • {user.email}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: selectedUsers.includes(user._id)
                      ? "#f5576c"
                      : "#e0e0e0",
                    backgroundColor: selectedUsers.includes(user._id)
                      ? "rgba(245, 87, 108, 0.05)"
                      : "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(245, 87, 108, 0.08)",
                      borderColor: "#f5576c",
                    },
                  }}
                />
              ))}
            </FormGroup>

            {filteredUsers.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{ py: 3 }}
              >
                Không tìm thấy học sinh nào
              </Typography>
            )}
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
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
            },
          }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
