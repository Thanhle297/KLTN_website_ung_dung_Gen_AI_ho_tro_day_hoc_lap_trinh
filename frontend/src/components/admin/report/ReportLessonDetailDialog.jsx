// components/admin/report/ReportLessonDetailDialog.jsx
// Dialog hiển thị chi tiết các bài con của 1 bài lớn cho 1 học sinh.
// Click bài con sẽ mở modal lịch sử nộp bài (qua callback onSubLessonClick).
import React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  MenuBook as MenuBookIcon,
} from "@mui/icons-material";
import { adminCardSx } from "../../../styles/adminTokens";

const pickColor = (progress) => {
  if (progress >= 80) return "success";
  if (progress >= 50) return "warning";
  if (progress > 0) return "error";
  return "default";
};

/**
 * @param {object}   props
 * @param {object|null} props.target - { userId, studentName, username, lessonId, lessonTitle, subLessons, scores, lessonScore }
 * @param {Function} props.onClose
 * @param {Function} props.onSubLessonClick - Callback khi bấm xem lịch sử bài con
 */
const ReportLessonDetailDialog = ({ target, onClose, onSubLessonClick }) => {
  const theme = useTheme();
  const open = Boolean(target);

  const subLessons = target?.subLessons || [];
  const scores = target?.scores || {};
  const lessonScore = target?.lessonScore;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...adminCardSx(theme),
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: theme.palette.gradient?.primary,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          py: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <MenuBookIcon />
          <Box>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
              Chi tiết bài lớn
            </Typography>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {target?.lessonTitle}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Học sinh: {target?.studentName}
              {target?.username ? ` (${target.username})` : ""}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: "white" }}
          aria-label="Đóng"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Tóm tắt bài lớn */}
        {lessonScore && (
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Chip
              icon={<CheckCircleIcon />}
              label={`${lessonScore.completedCount}/${lessonScore.totalCount} bài con đã hoàn thành`}
              color={
                lessonScore.completedCount === lessonScore.totalCount &&
                lessonScore.totalCount > 0
                  ? "success"
                  : "default"
              }
              variant={
                lessonScore.completedCount === lessonScore.totalCount &&
                lessonScore.totalCount > 0
                  ? "filled"
                  : "outlined"
              }
            />
            <Chip
              label={`Tiến độ TB: ${lessonScore.progress}%`}
              color={
                pickColor(lessonScore.progress) === "default"
                  ? undefined
                  : pickColor(lessonScore.progress)
              }
              sx={{ fontWeight: 700 }}
            />
          </Box>
        )}

        {subLessons.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              Bài lớn này chưa có bài con nào.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60 }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tên bài con</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 140 }} align="center">
                    Tiến độ tốt nhất
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 160 }} align="center">
                    Trạng thái
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 160 }} align="center">
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subLessons.map((sub, idx) => {
                  const score = scores[sub.subLessonId];
                  const progress = score?.progress || 0;
                  const completed = !!score?.completed;
                  const color = pickColor(progress);

                  return (
                    <TableRow
                      key={sub.subLessonId}
                      hover
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(0,0,0,0.02)",
                        },
                      }}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {sub.subLessonTitle}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {progress > 0 ? (
                          <Chip
                            label={`${progress}%`}
                            size="small"
                            color={color === "default" ? undefined : color}
                            sx={{ fontWeight: 700, minWidth: 60 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {completed ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <CheckCircleIcon
                              sx={{ fontSize: 16, color: "success.main" }}
                            />
                            <Typography
                              variant="caption"
                              color="success.main"
                              fontWeight={600}
                            >
                              Đã hoàn thành
                            </Typography>
                          </Stack>
                        ) : progress > 0 ? (
                          <Typography variant="caption" color="warning.main">
                            Đang làm
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            Chưa làm
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem lịch sử các lượt làm bài">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HistoryIcon />}
                            onClick={() =>
                              onSubLessonClick?.({
                                userId: target.userId,
                                subLessonId: sub.subLessonId,
                                studentName: target.studentName,
                                subLessonTitle: sub.subLessonTitle,
                              })
                            }
                          >
                            Lịch sử
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

ReportLessonDetailDialog.displayName = "ReportLessonDetailDialog";

export default React.memo(ReportLessonDetailDialog);
