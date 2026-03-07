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
import LessonRow from "./LessonRow";

const LessonsTable = React.memo(
  ({ lessons, loading, onEdit, onDelete, onToggleDisplay }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

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
                  Lesson ID
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Course ID
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
                  width={90}
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Thứ tự
                </TableCell>
                <TableCell
                  width={110}
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Số bài (SGK)
                </TableCell>
                <TableCell
                  width={110}
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Chế độ
                </TableCell>
                <TableCell
                  width={110}
                  align="center"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Hiển thị
                </TableCell>
                <TableCell
                  width={140}
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
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.lessonId}
                      lesson={lesson}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleDisplay={onToggleDisplay}
                    />
                  ))}

              {!loading && lessons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      😔 Không có bài học nào
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

LessonsTable.displayName = "LessonsTable";

export default LessonsTable;
