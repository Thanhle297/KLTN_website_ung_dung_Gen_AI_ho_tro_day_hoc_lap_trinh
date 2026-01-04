import React from "react";
import { TableRow, TableCell, IconButton, Stack } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const SubLessonRow = React.memo(({ subLesson, onEdit, onDelete }) => {
  return (
    <TableRow
      sx={{
        "&:hover": {
          backgroundColor: "#f7fafc",
          transform: "scale(1.01)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        },
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
    >
      <TableCell sx={{ fontWeight: 600 }}>{subLesson.lessonId}</TableCell>
      <TableCell>{subLesson.displayId}</TableCell>
      <TableCell sx={{ fontWeight: 500 }}>{subLesson.title}</TableCell>
      <TableCell sx={{ color: "#4a5568" }}>{subLesson.description}</TableCell>
      <TableCell>{subLesson.mode}</TableCell>
      <TableCell>{subLesson.display ? "Có" : "Không"}</TableCell>
      <TableCell align="center">{subLesson.requiredProgress ?? 70}%</TableCell>
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
                background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                transform: "scale(1.1)",
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
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
              width: 36,
              height: 36,
              "&:hover": {
                background: "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                transform: "scale(1.1)",
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
