import React from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Skeleton,
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
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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
