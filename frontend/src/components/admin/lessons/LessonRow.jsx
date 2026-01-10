import React from "react";
import {
  TableRow,
  TableCell,
  IconButton,
  Stack,
  Switch,
  Tooltip,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const LessonRow = React.memo(
  ({ lesson, onEdit, onDelete, onToggleDisplay }) => {
    return (
      <TableRow
        sx={{
          "&:hover": {
            backgroundColor: "#f7fafc",
            // transform: "scale(1.01)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          },
          // transition: "all 0.2s ease",
          cursor: "pointer",
        }}
      >
        <TableCell sx={{ fontWeight: 600 }}>{lesson.lessonId}</TableCell>
        <TableCell>{lesson.courseId}</TableCell>
        <TableCell sx={{ fontWeight: 500 }}>{lesson.title}</TableCell>
        <TableCell>{lesson.order}</TableCell>
        <TableCell>{lesson.mode}</TableCell>

        <TableCell align="center">
          <Tooltip title={lesson.display ? "Ẩn bài học" : "Hiện bài học"}>
            <Switch
              checked={!!lesson.display}
              onChange={(e) => onToggleDisplay(lesson, e.target.checked)}
              color="success"
            />
          </Tooltip>
        </TableCell>

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
                  background:
                    "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                  // transform: "scale(1.1)",
                },
                // transition: "all 0.2s ease",
              }}
              size="small"
            >
              <Edit sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              onClick={() => onDelete(lesson)}
              sx={{
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                width: 36,
                height: 36,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                  // transform: "scale(1.1)",
                },
                // transition: "all 0.2s ease",
              }}
              size="small"
            >
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>
    );
  }
);

LessonRow.displayName = "LessonRow";

export default LessonRow;
