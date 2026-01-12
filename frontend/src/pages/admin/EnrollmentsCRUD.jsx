import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  FileDownload,
  FileUpload,
  Save,
} from "@mui/icons-material";
import useAdminAPI from "../../hook/useAdminAPI";

export default function EnrollmentsCRUD() {
  const api = useAdminAPI();

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState({}); // { userId: [courseId1, courseId2] }
  const [originalEnrollments, setOriginalEnrollments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadData();
  }, []);

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

      // Tạo map enrollments
      const enrollMap = {};
      regularUsers.forEach((user) => {
        enrollMap[user._id] = user.enrolledCourses || [];
      });

      setEnrollments(enrollMap);
      setOriginalEnrollments(JSON.parse(JSON.stringify(enrollMap)));
    } catch (error) {
      console.error("❌ Load data error:", error);
      showMessage("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (userId, courseId) => {
    setEnrollments((prev) => {
      const userCourses = prev[userId] || [];
      const newCourses = userCourses.includes(courseId)
        ? userCourses.filter((id) => id !== courseId)
        : [...userCourses, courseId];

      return { ...prev, [userId]: newCourses };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let changeCount = 0;

      for (const userId of Object.keys(enrollments)) {
        const current = enrollments[userId] || [];
        const original = originalEnrollments[userId] || [];

        const toEnroll = current.filter((id) => !original.includes(id));
        const toUnenroll = original.filter((id) => !current.includes(id));

        for (const courseId of toEnroll) {
          await api.enrollUserToCourse(userId, courseId);
          changeCount++;
        }

        for (const courseId of toUnenroll) {
          await api.unenrollUserFromCourse(userId, courseId);
          changeCount++;
        }
      }

      showMessage(`Đã lưu ${changeCount} thay đổi`, "success");
      setOriginalEnrollments(JSON.parse(JSON.stringify(enrollments)));
    } catch (error) {
      console.error("❌ Save error:", error);
      showMessage("Lỗi khi lưu", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/csv/export-enrollments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "enrollments.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("❌ Export error:", error);
      showMessage("Lỗi khi export", "error");
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/csv/import-enrollments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();
      showMessage(
        `Import thành công ${result.success} dòng, lỗi ${result.errors} dòng`,
        result.errors > 0 ? "warning" : "success"
      );
      loadData();
    } catch (error) {
      console.error("❌ Import error:", error);
      showMessage("Lỗi khi import", "error");
    }

    event.target.value = "";
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/csv/template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Download template failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "enrollment_template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("❌ Download template error:", error);
      showMessage("Lỗi khi tải template", "error");
    }
  };

  const showMessage = (message, severity = "success") => {
    setSnack({ open: true, message, severity });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasChanges =
    JSON.stringify(enrollments) !== JSON.stringify(originalEnrollments);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Quản lý phân bổ khóa học
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ma trận users × courses - Click vào ô để phân bổ/gỡ
        </Typography>
      </Box>

      {/* Toolbar */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Tìm kiếm học sinh..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 250 }}
        />

        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleDownloadTemplate}
        >
          Tải mẫu CSV
        </Button>

        <Button variant="outlined" component="label" startIcon={<FileUpload />}>
          Import CSV
          <input type="file" hidden accept=".csv" onChange={handleImport} />
        </Button>

        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExport}
        >
          Export CSV
        </Button>

        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={!hasChanges || saving}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
            },
          }}
        >
          {saving ? <CircularProgress size={20} /> : `Lưu thay đổi`}
        </Button>

        {hasChanges && (
          <Chip label="Có thay đổi chưa lưu" color="warning" size="small" />
        )}
      </Box>

      {/* Ma trận */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    fontWeight: 700,
                    minWidth: 200,
                  }}
                >
                  Học sinh
                </TableCell>
                {courses.map((course) => (
                  <TableCell
                    key={course.courseId}
                    align="center"
                    sx={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      fontWeight: 700,
                      minWidth: 120,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {course.title}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      ID: {course.courseId}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {user.fullname || user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.username}
                    </Typography>
                  </TableCell>
                  {courses.map((course) => (
                    <TableCell key={course.courseId} align="center">
                      <Checkbox
                        checked={(enrollments[user._id] || []).includes(
                          course.courseId
                        )}
                        onChange={() => handleToggle(user._id, course.courseId)}
                        sx={{
                          color: "#667eea",
                          "&.Mui-checked": {
                            color: "#764ba2",
                          },
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Thống kê */}
      <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
        <Chip label={`${filteredUsers.length} học sinh`} />
        <Chip label={`${courses.length} khóa học`} />
        <Chip
          label={`${Object.values(enrollments).flat().length} phân bổ`}
          color="primary"
        />
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
