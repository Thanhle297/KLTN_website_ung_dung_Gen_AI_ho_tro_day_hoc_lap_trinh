import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  CircularProgress,
  OutlinedInput,
} from "@mui/material";
import { GroupAdd as GroupAddIcon } from "@mui/icons-material";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function BulkEnrollDialog({ open, onClose, onSave, api }) {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes] = await Promise.all([
        api.getUsers(),
        api.getCourses(),
      ]);

      const regularUsers = usersRes.data.filter((u) => u.role === "user");
      setUsers(regularUsers);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error("❌ Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedUsers.length === 0 || selectedCourses.length === 0) {
      alert("Vui lòng chọn ít nhất 1 học sinh và 1 khóa học");
      return;
    }

    try {
      setSaving(true);
      await api.bulkEnrollUsers(selectedUsers, selectedCourses);
      onSave();
      handleClose();
    } catch (error) {
      console.error("❌ Bulk enroll error:", error);
      alert(
        "Lỗi khi phân bổ: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSelectedCourses([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <GroupAddIcon />
        <Typography variant="h6" fontWeight={700}>
          Phân bổ hàng loạt
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Chọn học sinh */}
            <FormControl fullWidth>
              <InputLabel>Chọn học sinh</InputLabel>
              <Select
                multiple
                value={selectedUsers}
                onChange={(e) => setSelectedUsers(e.target.value)}
                input={<OutlinedInput label="Chọn học sinh" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((userId) => {
                      const user = users.find((u) => u._id === userId);
                      return (
                        <Chip
                          key={userId}
                          label={user?.fullname || user?.username}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.fullname || user.username} ({user.username})
                  </MenuItem>
                ))}
              </Select>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Đã chọn {selectedUsers.length} / {users.length} học sinh
              </Typography>
            </FormControl>

            {/* Chọn khóa học */}
            <FormControl fullWidth>
              <InputLabel>Chọn khóa học</InputLabel>
              <Select
                multiple
                value={selectedCourses}
                onChange={(e) => setSelectedCourses(e.target.value)}
                input={<OutlinedInput label="Chọn khóa học" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((courseId) => {
                      const course = courses.find(
                        (c) => c.courseId === courseId
                      );
                      return (
                        <Chip
                          key={courseId}
                          label={course?.title}
                          size="small"
                          color="primary"
                        />
                      );
                    })}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {courses.map((course) => (
                  <MenuItem key={course.courseId} value={course.courseId}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Đã chọn {selectedCourses.length} / {courses.length} khóa học
              </Typography>
            </FormControl>

            {/* Thông tin tổng kết */}
            {selectedUsers.length > 0 && selectedCourses.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)",
                  border: "1px solid rgba(79, 172, 254, 0.3)",
                }}
              >
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  📊 Tổng kết:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {selectedUsers.length} học sinh
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {selectedCourses.length} khóa học
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                  → Tổng cộng: {selectedUsers.length * selectedCourses.length}{" "}
                  phân bổ
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
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
          disabled={
            loading ||
            saving ||
            selectedUsers.length === 0 ||
            selectedCourses.length === 0
          }
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
            },
          }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : "Phân bổ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
