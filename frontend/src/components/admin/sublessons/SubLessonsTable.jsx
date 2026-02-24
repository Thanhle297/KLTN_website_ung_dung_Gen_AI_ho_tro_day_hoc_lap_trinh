import React from "react";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import SubLessonRow from "./SubLessonRow";

const SubLessonsTable = React.memo(
  ({ subLessons, loading, selectedLesson, onEdit, onDelete }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    if (!selectedLesson) {
      return (
        <Paper
          sx={{
            borderRadius: 4,
            p: 8,
            textAlign: "center",
            boxShadow: isDark
              ? "0 8px 32px rgba(0, 0, 0, 0.3)"
              : "0 8px 32px rgba(0, 0, 0, 0.1)",
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            📚 Hãy chọn một bài học để xem subLessons
          </Typography>
        </Paper>
      );
    }

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
          <CircularProgress
            size={60}
            sx={{
              color: isDark ? theme.palette.primary.main : "white",
            }}
          />
        </Box>
      );
    }

    return (
      <Paper
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: isDark
            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
            : "0 8px 32px rgba(0, 0, 0, 0.1)",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  background: isDark
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    py: 2,
                  }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Display ID
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Tiêu đề
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Mô tả
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Chế độ
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Hiển thị
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Điểm đạt %
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {subLessons.map((subLesson) => (
                <SubLessonRow
                  key={subLesson.lessonId}
                  subLesson={subLesson}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}

              {subLessons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      😔 Không có subLesson nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }
);

SubLessonsTable.displayName = "SubLessonsTable";

export default SubLessonsTable;
