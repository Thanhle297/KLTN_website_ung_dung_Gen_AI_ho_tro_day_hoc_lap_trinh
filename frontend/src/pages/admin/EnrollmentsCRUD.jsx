import React, { useCallback, useEffect, useState } from "react";
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
  Stack,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  FileDownload,
  FileUpload,
  Save,
  Assignment,
} from "@mui/icons-material";
import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";
import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import AdminTableSkeleton from "../../components/admin/shared/AdminTableSkeleton";
import { adminCardSx, gradientButtonSx } from "../../styles/adminTokens";

export default function EnrollmentsCRUD() {
  const api = useAdminAPI();
  const theme = useTheme();
  const notify = useNotify();

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState({}); // { userId: [courseId1, courseId2] }
  const [originalEnrollments, setOriginalEnrollments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
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
      notify.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      const add = [];
      const remove = [];

      for (const userId of Object.keys(enrollments)) {
        const current = enrollments[userId] || [];
        const original = originalEnrollments[userId] || [];

        current.filter((id) => !original.includes(id))
          .forEach((courseId) => add.push({ userId, courseId }));
        original.filter((id) => !current.includes(id))
          .forEach((courseId) => remove.push({ userId, courseId }));
      }

      if (add.length === 0 && remove.length === 0) {
        notify.warning("Không có thay đổi nào");
        return;
      }

      const res = await api.bulkUpdateEnrollments({ add, remove });
      notify.success(res.data.message || `Đã lưu ${add.length + remove.length} thay đổi`);
      setOriginalEnrollments(JSON.parse(JSON.stringify(enrollments)));
    } catch (error) {
      console.error("❌ Save error:", error);
      notify.error("Lỗi khi lưu");
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
      notify.error("Lỗi khi export");
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
      notify(
        `Import thành công ${result.success} dòng, lỗi ${result.errors} dòng`,
        result.errors > 0 ? "warning" : "success"
      );
      loadData();
    } catch (error) {
      console.error("❌ Import error:", error);
      notify.error("Lỗi khi import");
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
      notify.error("Lỗi khi tải template");
    }
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
      <AdminPageWrapper>
        <AdminPageHeader
          icon={<Assignment />}
          title="Quản lý phân bổ khóa học"
          subtitle="Đang tải dữ liệu..."
        />
        <AdminTableSkeleton rows={8} columns={6} />
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      <AdminPageHeader
        icon={<Assignment />}
        title="Quản lý phân bổ khóa học"
        subtitle="Ma trận users × courses - Click vào ô để phân bổ/gỡ"
        actions={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={handleDownloadTemplate}>
              Tải mẫu CSV
            </Button>
            <Button variant="outlined" component="label" startIcon={<FileUpload />}>
              Import CSV
              <input type="file" hidden accept=".csv" onChange={handleImport} />
            </Button>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
              sx={gradientButtonSx(theme)}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            {hasChanges && <Chip label="Có thay đổi chưa lưu" color="warning" size="small" />}
          </Stack>
        }
        filters={
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
            sx={{ minWidth: 250 }}
          />
        }
      />

      {/* Ma trận */}
      <Paper sx={adminCardSx(theme)}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    background: theme.palette.gradient.primary,
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
                      background: theme.palette.gradient.primary,
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
                          color: theme.palette.primary.main,
                          "&.Mui-checked": {
                            color: theme.palette.primary.dark,
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
    </AdminPageWrapper>
  );
}
