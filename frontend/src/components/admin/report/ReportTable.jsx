// components/admin/report/ReportTable.jsx
// Bảng điểm học sinh theo bài lớn + chú thích cho trang Báo cáo điểm
import React from "react";
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import { adminCardSx } from "../../../styles/adminTokens";

// --- Helper: chọn màu theo mức progress ---
const pickColor = (progress) => {
  if (progress >= 80) return "success";
  if (progress >= 50) return "warning";
  if (progress > 0) return "error";
  return "default";
};

// --- Helper: hiển thị ô tổng hợp theo bài lớn ---
const renderLessonCell = (lessonScore) => {
  const totalCount = lessonScore?.totalCount || 0;
  const completedCount = lessonScore?.completedCount || 0;
  const progress = lessonScore?.progress || 0;

  if (totalCount === 0) {
    return (
      <Typography variant="body2" color="text.disabled">
        -
      </Typography>
    );
  }

  const color = pickColor(progress);
  const isAllDone = completedCount === totalCount;

  return (
    <Stack alignItems="center" spacing={0.25}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          color={color === "default" ? "text.secondary" : `${color}.main`}
        >
          {completedCount}/{totalCount}
        </Typography>
        {isAllDone && (
          <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
        )}
      </Box>
      <Chip
        label={`${progress}%`}
        size="small"
        color={color === "default" ? undefined : color}
        variant={progress === 0 ? "outlined" : "filled"}
        sx={{
          height: 18,
          fontSize: "0.7rem",
          fontWeight: 600,
          minWidth: 48,
        }}
      />
    </Stack>
  );
};

/**
 * @param {object}   props
 * @param {object}   props.reportData         - Dữ liệu báo cáo (lessonStructure, students…)
 * @param {Array}    props.filteredStudents   - Danh sách học sinh sau khi lọc
 * @param {Function} props.onCellClick        - Callback khi click ô bài lớn (mở dialog chi tiết)
 */
const ReportTable = ({ reportData, filteredStudents, onCellClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const lessonStructure = reportData?.lessonStructure || [];

  // Style chung cho header cell cố định
  const stickyHeadSx = {
    fontWeight: 700,
    backgroundColor: isDark ? theme.palette.background.paper : "#f5f5f5",
  };

  // Style cho cột trung bình
  const avgColBg = isDark ? "rgba(33, 150, 243, 0.15)" : "#e3f2fd";

  // Tính background cho sticky body cell theo chẵn/lẻ
  const stickyBodyBg = (index) =>
    isDark
      ? theme.palette.background.paper
      : index % 2 === 0
      ? "#fafafa"
      : "#ffffff";

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          ...adminCardSx(theme),
          maxHeight: "calc(100vh - 400px)",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "auto",
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  ...stickyHeadSx,
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
                  ...stickyHeadSx,
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
                  ...stickyHeadSx,
                  position: "sticky",
                  left: 170,
                  zIndex: 3,
                  minWidth: 180,
                }}
              >
                Họ tên
              </TableCell>

              {/* Cột động cho từng bài lớn */}
              {lessonStructure.map((lesson) => (
                <TableCell
                  key={lesson.lessonId}
                  align="center"
                  sx={{
                    ...stickyHeadSx,
                    fontWeight: 600,
                    minWidth: 130,
                    fontSize: "0.78rem",
                  }}
                >
                  <Tooltip
                    title={`${lesson.lessonTitle} (${lesson.subLessons.length} bài con)`}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        noWrap
                        fontWeight={700}
                        sx={{ maxWidth: 140 }}
                      >
                        {lesson.lessonTitle}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.65rem" }}
                      >
                        {lesson.subLessons.length} bài con
                      </Typography>
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}

              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  backgroundColor: avgColBg,
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
                {/* STT */}
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    backgroundColor: stickyBodyBg(index),
                    zIndex: 2,
                    boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                  }}
                >
                  {index + 1}
                </TableCell>

                {/* Username */}
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 50,
                    backgroundColor: stickyBodyBg(index),
                    zIndex: 2,
                    fontWeight: 500,
                    boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                  }}
                >
                  {student.username}
                </TableCell>

                {/* Họ tên */}
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 170,
                    backgroundColor: stickyBodyBg(index),
                    zIndex: 2,
                    fontWeight: 600,
                    boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                  }}
                >
                  {student.fullname}
                </TableCell>

                {/* Mỗi bài lớn — click để xem chi tiết bài con */}
                {lessonStructure.map((lesson) => {
                  const lessonScore = student.lessonScores?.[lesson.lessonId];
                  const hasSubs = (lessonScore?.totalCount || 0) > 0;
                  return (
                    <TableCell
                      key={lesson.lessonId}
                      align="center"
                      onClick={
                        hasSubs
                          ? () =>
                              onCellClick({
                                userId: student.userId,
                                studentName: student.fullname,
                                username: student.username,
                                lessonId: lesson.lessonId,
                                lessonTitle: lesson.lessonTitle,
                                subLessons: lesson.subLessons,
                                scores: student.scores,
                                lessonScore,
                              })
                          : undefined
                      }
                      sx={{
                        ...(hasSubs && {
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          "&:hover": {
                            backgroundColor:
                              "rgba(102, 126, 234, 0.15) !important",
                          },
                        }),
                      }}
                    >
                      {renderLessonCell(lessonScore)}
                    </TableCell>
                  );
                })}

                {/* Điểm trung bình */}
                <TableCell align="center" sx={{ backgroundColor: avgColBg }}>
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
                  colSpan={lessonStructure.length + 4}
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
        <Typography variant="caption" color="text.secondary">
          Mỗi ô hiển thị <b>số bài con đã hoàn thành / tổng số bài con</b> và % tiến độ trung bình. Nhấn vào ô để xem chi tiết.
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
          <Typography variant="caption">Hoàn thành toàn bộ bài con</Typography>
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
  );
};

ReportTable.displayName = "ReportTable";

export default React.memo(ReportTable);
