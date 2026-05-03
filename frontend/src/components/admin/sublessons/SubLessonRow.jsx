import React from "react";
import {
  TableRow,
  TableCell,
  IconButton,
  Stack,
  Typography,
  useTheme,
  Chip,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const SubLessonRow = React.memo(({ subLesson, onEdit, onDelete }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <TableRow
      sx={{
        transition: "all 0.2s ease",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: isDark
            ? "rgba(102, 126, 234, 0.08)"
            : "#f7fafc",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        },
      }}
    >
      {/* lessonId badge */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? theme.palette.text.secondary : "#718096",
            fontFamily: "monospace",
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "#edf2f7",
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            display: "inline-block",
            fontWeight: 600,
          }}
        >
          {subLesson.lessonId}
        </Typography>
      </TableCell>

      {/* displayId */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? theme.palette.text.secondary : "#4a5568",
          }}
        >
          {subLesson.displayId}
        </Typography>
      </TableCell>

      {/* title */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: isDark
              ? theme.palette.text.primary
              : "#2d3748",
          }}
        >
          {subLesson.title}
        </Typography>
      </TableCell>

      {/* description */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            color: isDark
              ? theme.palette.text.secondary
              : "#4a5568",
            maxWidth: 280,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subLesson.description}
        </Typography>
      </TableCell>

      {/* mode */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            color: isDark
              ? theme.palette.text.secondary
              : "#718096",
          }}
        >
          {subLesson.mode}
        </Typography>
      </TableCell>

      {/* display */}
      <TableCell>
        <Chip
          label={subLesson.display ? "Có" : "Không"}
          size="small"
          sx={{
            fontWeight: 600,
            background: subLesson.display
              ? "linear-gradient(135deg, #38ef7d 0%, #11998e 100%)"
              : isDark
              ? "rgba(255,255,255,0.1)"
              : "#e0e0e0",
            color: subLesson.display
              ? "white"
              : isDark
              ? theme.palette.text.secondary
              : "#666",
          }}
        />
      </TableCell>

      {/* requiredProgress */}
      <TableCell align="center">
        <Chip
          label={`${subLesson.requiredProgress ?? 70}%`}
          size="small"
          sx={{
            fontWeight: 600,
            background: theme.palette.gradient.primary,
            color: "white",
          }}
        />
      </TableCell>

      {/* actions */}
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton
            onClick={() => onEdit(subLesson)}
            sx={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              width: 36,
              height: 36,
              "&:hover": {
                background:
                  "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
              },
              transition: "all 0.2s ease",
            }}
            size="small"
          >
            <Edit sx={{ fontSize: 18 }} />
          </IconButton>

          <IconButton
            onClick={() => onDelete(subLesson)}
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

SubLessonRow.displayName = "SubLessonRow";
export default SubLessonRow;
