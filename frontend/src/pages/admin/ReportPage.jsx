// src/pages/admin/CourseReportPage.jsx
// Trang hiển thị báo cáo điểm học sinh theo khóa học
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import ReportHeader from "../../components/admin/report/ReportHeader";
import ReportSearchBar from "../../components/admin/report/ReportSearchBar";
import ReportTable from "../../components/admin/report/ReportTable";
import ReportLessonDetailDialog from "../../components/admin/report/ReportLessonDetailDialog";
import SubmissionHistoryDialog from "../../components/admin/report/SubmissionHistoryDialog";
import useReportAPI from "../../hook/useReportAPI";
import useNotify from "../../hook/useNotify";
import { adminCardSx } from "../../styles/adminTokens";

export default function CourseReportPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const reportAPI = useReportAPI();
  const theme = useTheme();
  const notify = useNotify();

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  // State cho dialog chi tiết bài lớn: { userId, studentName, lessonId, lessonTitle, subLessons, scores }
  const [lessonTarget, setLessonTarget] = useState(null);
  // State cho modal lịch sử nộp bài: { userId, subLessonId, studentName, subLessonTitle }
  const [historyTarget, setHistoryTarget] = useState(null);

  // --- Tải báo cáo ---
  const loadReport = useCallback(async () => {
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
  }, [courseId, reportAPI]);

  useEffect(() => {
    if (courseId) loadReport();
  }, [courseId, loadReport]);

  // --- Xuất CSV ---
  const handleExportCSV = useCallback(async () => {
    try {
      setExporting(true);
      const response = await reportAPI.exportScoresCSV(courseId);

      // Tạo tên file (loại bỏ dấu tiếng Việt)
      const courseName = reportData?.courseTitle
        ? reportData.courseTitle
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
      notify.error("Lỗi khi xuất file CSV. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }, [courseId, reportAPI, reportData?.courseTitle, notify]);

  // --- Lọc học sinh theo từ khoá tìm kiếm ---
  const filteredStudents = useMemo(
    () =>
      reportData?.students?.filter(
        (student) =>
          student.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.username?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [reportData?.students, searchTerm]
  );

  // --- Callbacks ---
  const handleCellClick = useCallback((target) => setLessonTarget(target), []);
  const handleCloseLesson = useCallback(() => setLessonTarget(null), []);
  const handleSubLessonClick = useCallback(
    (target) => setHistoryTarget(target),
    []
  );
  const handleCloseHistory = useCallback(() => setHistoryTarget(null), []);

  return (
    <AdminPageWrapper>
      {/* Breadcrumb + nút quay lại */}
      <ReportHeader navigate={navigate} />

      {/* Card chính */}
      <Paper sx={{ ...adminCardSx(theme), overflow: "hidden" }}>
        {/* Tiêu đề khóa học */}
        <Box
          sx={{
            background: theme.palette.gradient.primary,
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
                {reportData?.courseTitle || `Khóa học #${courseId}`}
              </Typography>
            </Box>
          </Box>

          {reportData && (
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
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
                label={`${reportData.totalLessons || 0} bài lớn`}
                size="small"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`${reportData.totalSubLessons} bài con`}
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

        {/* Nội dung */}
        <Box sx={{ p: 3 }}>
          {loading ? (
            /* Skeleton loading */
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    variant="text"
                    width={j === 0 ? 40 : 100}
                    sx={{
                      fontSize: "0.875rem",
                      flex: j > 2 ? 1 : "none",
                    }}
                  />
                ))}
              </Box>
              {Array.from({ length: 8 }).map((_, i) => (
                <Box key={i} sx={{ display: "flex", gap: 2, mb: 1 }}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <Skeleton
                      key={j}
                      variant="rounded"
                      height={32}
                      sx={{
                        flex: j > 2 ? 1 : "none",
                        width: j === 0 ? 40 : j <= 2 ? 100 : undefined,
                      }}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          ) : error ? (
            /* Trạng thái lỗi */
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
              <ReportSearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onExport={handleExportCSV}
                exporting={exporting}
                onRefresh={loadReport}
                loading={loading}
              />
              <ReportTable
                reportData={reportData}
                filteredStudents={filteredStudents}
                onCellClick={handleCellClick}
              />
            </>
          ) : null}
        </Box>
      </Paper>

      {/* Dialog chi tiết bài lớn */}
      <ReportLessonDetailDialog
        target={lessonTarget}
        onClose={handleCloseLesson}
        onSubLessonClick={handleSubLessonClick}
      />

      {/* Modal lịch sử nộp bài của học sinh */}
      <SubmissionHistoryDialog
        target={historyTarget}
        courseId={courseId}
        onClose={handleCloseHistory}
      />
    </AdminPageWrapper>
  );
}
