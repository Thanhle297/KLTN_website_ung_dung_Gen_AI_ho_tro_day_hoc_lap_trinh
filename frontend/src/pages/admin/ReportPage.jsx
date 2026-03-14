// src/pages/admin/CourseReportPage.jsx
// Trang hiển thị báo cáo điểm học sinh theo khóa học
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Skeleton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  useTheme,
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import useReportAPI from "../../hook/useReportAPI";
import SubmissionHistoryModal from "../../components/SubmissionHistoryModal";

export default function CourseReportPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const reportAPI = useReportAPI();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  // State cho modal lịch sử nộp bài: { userId, subLessonId, studentName }
  const [historyTarget, setHistoryTarget] = useState(null);

  useEffect(() => {
    if (courseId) {
      loadReport();
    }
  }, [courseId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportAPI.getCourseReport(courseId);
      setReportData(response.data);
    } catch (err) {
      console.error("❌ Load report error:", err);
      setError(
        err.response?.data?.message || "Lỗi khi tải báo cáo. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await reportAPI.exportScoresCSV(courseId);

      // Tạo tên file
      const courseName = reportData?.courseName
        ? reportData.courseName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/[^a-zA-Z0-9]/g, "_")
        : "Course";
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Diem_${courseName}_${timestamp}.csv`;

      reportAPI.downloadCSV(response.data, filename);
    } catch (err) {
      console.error("❌ Export CSV error:", err);
      alert("Lỗi khi xuất file CSV. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  // Filter students theo search
  const filteredStudents = reportData?.students?.filter(
    (student) =>
      student.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm render cell điểm với màu sắc
  const renderScoreCell = (score) => {
    if (!score || score.progress === 0) {
      return (
        <Typography variant="body2" color="text.disabled">
          -
        </Typography>
      );
    }

    const progress = score.progress;
    let color = "error";
    if (progress >= 80) color = "success";
    else if (progress >= 50) color = "warning";

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2" fontWeight={600} color={`${color}.main`}>
          {progress}%
        </Typography>
        {score.completed && (
          <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        maxWidth: "100%",
        background: theme.palette.mode === "dark"
          ? theme.palette.background.default
          : "linear-gradient(135deg, #42A5F5 0%, #2196F3 50%, #1976D2 100%)",
        p: 3,
        overflow: "hidden",
      }}
    >
      {/* Header với breadcrumb */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
        <Box>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 1, color: theme.palette.mode === "dark" ? theme.palette.text.primary : "white" }}
          >
            <Link
              underline="hover"
              sx={{
                display: "flex",
                alignItems: "center",
                color: theme.palette.mode === "dark" ? theme.palette.text.primary : "white",
                cursor: "pointer",
              }}
              onClick={() => navigate("/admin/courses")}
            >
              <SchoolIcon sx={{ mr: 0.5 }} fontSize="small" />
              Quản lý Khóa học
            </Link>
            <Typography
              sx={{ display: "flex", alignItems: "center", color: theme.palette.mode === "dark" ? theme.palette.text.primary : "white" }}
            >
              <AssessmentIcon sx={{ mr: 0.5 }} fontSize="small" />
              Báo cáo điểm
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/admin/courses")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: theme.palette.mode === "dark" ? theme.palette.text.primary : "white",
                backgroundColor: theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                "&:hover": {
                  backgroundColor: theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(255, 255, 255, 0.25)",
                },
              }}
            >
              Quay lại
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main content box */}
<Paper
        sx={{
          borderRadius: 3,
          boxShadow: theme.palette.mode === "dark" 
            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
            : "0 8px 32px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {/* Title */}
<Box
          sx={{
            background: theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssessmentIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Báo cáo điểm học sinh
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {reportData?.courseName || `Khóa học #${courseId}`}
              </Typography>
            </Box>
          </Box>

          {reportData && (
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Chip
                label={`${reportData.totalStudents} học sinh`}
                size="small"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`${reportData.totalSubLessons} bài học`}
                size="small"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              {/* Header row skeleton */}
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} variant="text" width={j === 0 ? 40 : 100} sx={{ fontSize: "0.875rem", flex: j > 2 ? 1 : "none" }} />
                ))}
              </Box>
              {/* Data rows skeleton */}
              {Array.from({ length: 8 }).map((_, i) => (
                <Box key={i} sx={{ display: "flex", gap: 2, mb: 1 }}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <Skeleton key={j} variant="rounded" height={32}
                      sx={{ flex: j > 2 ? 1 : "none", width: j === 0 ? 40 : j <= 2 ? 100 : undefined }} />
                  ))}
                </Box>
              ))}
            </Box>
          ) : error ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 300,
                gap: 2,
              }}
            >
              <CancelIcon sx={{ fontSize: 60, color: "error.main" }} />
              <Typography color="error" fontWeight={600}>
                {error}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadReport}
              >
                Thử lại
              </Button>
            </Box>
          ) : reportData ? (
            <>
              {/* Toolbar */}
              <Box
                sx={{
                  mb: 3,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
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
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 250 }}
                />

                <Box sx={{ flex: 1 }} />

                <Button
                  variant="contained"
                  startIcon={
                    exporting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                  onClick={handleExportCSV}
                  disabled={exporting}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    background:
                      "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #38ef7d 0%, #11998e 100%)",
                    },
                  }}
                >
                  {exporting ? "Đang xuất..." : "Xuất CSV"}
                </Button>

                <Tooltip title="Tải lại dữ liệu">
                  <IconButton onClick={loadReport} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Bảng điểm */}
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: "calc(100vh - 400px)",
                  maxWidth: "100%",
                  overflowX: "auto",
                  overflowY: "auto",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderRadius: 2,
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          backgroundColor: theme.palette.mode === "dark"
                            ? theme.palette.background.paper
                            : "#f5f5f5",
                          position: "sticky",
                          left: 0,
                          zIndex: 3,
                          minWidth: 50,
                        }}
                      >
                        STT
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          backgroundColor: theme.palette.mode === "dark"
                            ? theme.palette.background.paper
                            : "#f5f5f5",
                          position: "sticky",
                          left: 50,
                          zIndex: 3,
                          minWidth: 120,
                        }}
                      >
                        Username
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          backgroundColor: theme.palette.mode === "dark"
                            ? theme.palette.background.paper
                            : "#f5f5f5",
                          position: "sticky",
                          left: 170,
                          zIndex: 3,
                          minWidth: 180,
                        }}
                      >
                        Họ tên
                      </TableCell>

                      {/* Cột động cho từng bài học */}
                      {reportData.structure?.map((sub) => (
                        <TableCell
                          key={sub.subLessonId}
                          align="center"
                          sx={{
                            fontWeight: 600,
                            backgroundColor: theme.palette.mode === "dark"
                              ? theme.palette.background.paper
                              : "#f5f5f5",
                            minWidth: 100,
                            fontSize: "0.75rem",
                          }}
                        >
                          <Tooltip
                            title={`${sub.lessonTitle} - ${sub.subLessonTitle}`}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                display="block"
                                noWrap
                                sx={{ maxWidth: 100 }}
                              >
                                {sub.subLessonTitle}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                      ))}

                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: theme.palette.mode === "dark"
                            ? "rgba(33, 150, 243, 0.15)"
                            : "#e3f2fd",
                          minWidth: 80,
                        }}
                      >
                        TB
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredStudents?.map((student, index) => (
                      <TableRow
                        key={student.userId}
                        sx={{
                          "&:nth-of-type(odd)": {
                            backgroundColor: "rgba(0, 0, 0, 0.02)",
                          },
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.08)",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            position: "sticky",
                            left: 0,
                            backgroundColor: theme.palette.mode === "dark"
                              ? theme.palette.background.paper
                              : index % 2 === 0 ? "#fafafa" : "#ffffff",
                            zIndex: 2,
                            boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                            "&:hover": {
                              backgroundColor: "rgba(102, 126, 234, 0.08)",
                            },
                          }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          sx={{
                            position: "sticky",
                            left: 50,
                            backgroundColor: theme.palette.mode === "dark"
                              ? theme.palette.background.paper
                              : index % 2 === 0 ? "#fafafa" : "#ffffff",
                            zIndex: 2,
                            fontWeight: 500,
                            boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                            "&:hover": {
                              backgroundColor: "rgba(102, 126, 234, 0.08)",
                            },
                          }}
                        >
                          {student.username}
                        </TableCell>
                        <TableCell
                          sx={{
                            position: "sticky",
                            left: 170,
                            backgroundColor: theme.palette.mode === "dark"
                              ? theme.palette.background.paper
                              : index % 2 === 0 ? "#fafafa" : "#ffffff",
                            zIndex: 2,
                            fontWeight: 600,
                            boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                            "&:hover": {
                              backgroundColor: "rgba(102, 126, 234, 0.08)",
                            },
                          }}
                        >
                          {student.fullname}
                        </TableCell>

                        {/* Điểm từng bài - click để xem lịch sử nộp bài */}
                        {reportData.structure?.map((sub) => {
                          const score = student.scores[sub.subLessonId];
                          const hasScore = score && score.progress > 0;
                          return (
                            <TableCell
                              key={sub.subLessonId}
                              align="center"
                              onClick={hasScore ? () => setHistoryTarget({
                                userId: student.userId,
                                subLessonId: sub.subLessonId,
                                studentName: student.fullname,
                                subLessonTitle: sub.subLessonTitle,
                              }) : undefined}
                              sx={{
                                ...(hasScore && {
                                  cursor: "pointer",
                                  transition: "background-color 0.2s",
                                  "&:hover": {
                                    backgroundColor: "rgba(102, 126, 234, 0.15) !important",
                                  },
                                }),
                              }}
                            >
                              {renderScoreCell(score)}
                            </TableCell>
                          );
                        })}

                        {/* Điểm trung bình */}
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: theme.palette.mode === "dark"
                            ? "rgba(33, 150, 243, 0.15)"
                            : "#e3f2fd" }}
                        >
                          <Chip
                            label={`${student.averageProgress}%`}
                            size="small"
                            color={
                              student.averageProgress >= 80
                                ? "success"
                                : student.averageProgress >= 50
                                ? "warning"
                                : "error"
                            }
                            sx={{ fontWeight: 700, minWidth: 60 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredStudents?.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={reportData.structure?.length + 4}
                          align="center"
                          sx={{ py: 5 }}
                        >
                          <Typography color="text.secondary">
                            Không tìm thấy học sinh nào
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Chú thích */}
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Chú thích:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CheckCircleIcon
                    sx={{ fontSize: 14, color: "success.main" }}
                  />
                  <Typography variant="caption">Đã hoàn thành</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Chip
                    label="≥80%"
                    size="small"
                    color="success"
                    sx={{ height: 20 }}
                  />
                  <Typography variant="caption">Hoàn thành tốt</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Chip
                    label="50-79%"
                    size="small"
                    color="warning"
                    sx={{ height: 20 }}
                  />
                  <Typography variant="caption">Hoàn thành</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Chip
                    label="<50%"
                    size="small"
                    color="error"
                    sx={{ height: 20 }}
                  />
                  <Typography variant="caption">Chưa hoàn thành</Typography>
                </Box>
              </Box>
            </>
          ) : null}
        </Box>
      </Paper>

      {/* Modal lịch sử nộp bài của học sinh */}
      {historyTarget && (
        <SubmissionHistoryModal
          userId={historyTarget.userId}
          subLessonId={historyTarget.subLessonId}
          onClose={() => setHistoryTarget(null)}
          from="admin"
          courseId={courseId}
        />
      )}
    </Box>
  );
}
