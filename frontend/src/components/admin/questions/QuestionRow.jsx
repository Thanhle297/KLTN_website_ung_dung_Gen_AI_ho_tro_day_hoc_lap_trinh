import React from "react";
import { TableRow, TableCell, IconButton, Stack } from "@mui/material";
import { Edit, Delete, Assignment } from "@mui/icons-material";

const QuestionRow = React.memo(({ question, onEdit, onDelete, onAssign }) => {
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
      <TableCell sx={{ fontWeight: 600 }}>{question.id}</TableCell>
      <TableCell sx={{ color: "#2d3748" }}>
        {question.category || "—"}
      </TableCell>
      <TableCell sx={{ fontWeight: 500 }}>{question.question}</TableCell>
      <TableCell>{question.ex?.length || 0}</TableCell>
      <TableCell>{question.testcase?.length || 0}</TableCell>
      <TableCell>{question.echo_input ? "Có" : "Không"}</TableCell>
      <TableCell sx={{ color: "#4a5568" }}>{question.topic}</TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onAssign && (
            <IconButton
              onClick={() => onAssign(question)}
              sx={{
                background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                color: "white",
                width: 36,
                height: 36,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)",
                },
              }}
              size="small"
              title="Phân phối về bài học"
            >
              <Assignment sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          <IconButton
            onClick={() => onEdit(question)}
            sx={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              width: 36,
              height: 36,
              "&:hover": {
                background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                // transform: "scale(1.1)",
              },
              // transition: "all 0.2s ease",
            }}
            size="small"
          >
            <Edit sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            onClick={() => onDelete(question)}
            sx={{
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
              width: 36,
              height: 36,
              "&:hover": {
                background: "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
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
});

QuestionRow.displayName = "QuestionRow";

export default QuestionRow;
