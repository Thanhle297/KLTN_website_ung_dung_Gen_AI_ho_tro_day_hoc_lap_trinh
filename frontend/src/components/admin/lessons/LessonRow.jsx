import React from "react";
import {
  TableRow,
  TableCell,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Chip,
  Typography,
  useTheme,
} from "@mui/material";
import { Edit, Delete, Warning } from "@mui/icons-material";

const LessonRow = React.memo(({ lesson, onEdit, onDelete, onToggleDisplay }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <TableRow
      sx={{
        transition: "all 0.2s ease",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: isDark ? "rgba(102, 126, 234, 0.08)" : "#f7fafc",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        },
      }}
    >
      {/* lessonId (badge style) */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? theme.palette.text.secondary : "#718096",
            fontFamily: "monospace",
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#edf2f7",
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            display: "inline-block",
            fontWeight: 600,
          }}
        >
          {lesson.lessonId}
        </Typography>
      </TableCell>

      {/* courseId */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ color: isDark ? theme.palette.text.secondary : "#4a5568" }}
        >
          {lesson.courseId}
        </Typography>
      </TableCell>

      {/* title */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: isDark ? theme.palette.text.primary : "#2d3748" }}
        >
          {lesson.title}
        </Typography>
      </TableCell>

      {/* order */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ color: isDark ? theme.palette.text.secondary : "#4a5568" }}
        >
          {lesson.order}
        </Typography>
      </TableCell>

      {/* lessonNumber */}
      <TableCell>
        {lesson.lessonNumber ? (
          <Chip
            label={`Bài ${lesson.lessonNumber}`}
            size="small"
            sx={{
              fontWeight: 600,
              background: theme.palette.gradient.primary,
              color: "white",
            }}
          />
        ) : (
          <Tooltip title="Chưa gán số bài học (SGK)">
            <Warning sx={{ color: "#f59e0b", fontSize: 20 }} />
          </Tooltip>
        )}
      </TableCell>

      {/* mode */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ color: isDark ? theme.palette.text.secondary : "#718096" }}
        >
          {lesson.mode}
        </Typography>
      </TableCell>

      {/* display */}
      <TableCell align="center">
        <Tooltip title={lesson.display ? "Ẩn bài học" : "Hiện bài học"}>
          <Switch
            checked={!!lesson.display}
            onChange={(e) => onToggleDisplay(lesson, e.target.checked)}
            color="success"
          />
        </Tooltip>
      </TableCell>

      {/* actions */}
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton
            onClick={() => onEdit(lesson)}
            sx={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              width: 36,
              height: 36,
              "&:hover": {
                background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
              },
              transition: "all 0.2s ease",
            }}
            size="small"
          >
            <Edit sx={{ fontSize: 18 }} />
          </IconButton>

          <IconButton
            onClick={() => onDelete(lesson)}
            sx={{
              background: theme.palette.gradient.danger,
              color: "white",
              width: 36,
              height: 36,
              "&:hover": {
                background: theme.palette.gradient.danger,
              },
              transition: "all 0.2s ease",
            }}
            size="small"
          >
            <Delete sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
});

LessonRow.displayName = "LessonRow";
export default LessonRow;
