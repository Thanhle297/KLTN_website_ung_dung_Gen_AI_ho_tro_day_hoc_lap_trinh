import React from "react";
import {
  TableRow,
  TableCell,
  IconButton,
  Stack,
  Typography,
  useTheme,
  Chip,
  Checkbox,
} from "@mui/material";
import { Edit, Delete, Assignment } from "@mui/icons-material";

const QuestionRow = React.memo(({ question, onEdit, onDelete, onAssign, selectable, selected, onSelect }) => {
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
      {/* Checkbox */}
      {selectable && (
        <TableCell padding="checkbox">
          <Checkbox
            checked={!!selected}
            onChange={onSelect}
            size="small"
          />
        </TableCell>
      )}

      {/* ID badge */}
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
          {question.id}
        </Typography>
      </TableCell>

      {/* Category */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ color: isDark ? theme.palette.text.primary : "#2d3748", fontWeight: 600 }}
        >
          {question.category || "—"}
        </Typography>
      </TableCell>

      {/* Question HTML */}
      <TableCell
        sx={{
          fontWeight: 500,
          color: isDark ? theme.palette.text.primary : "#2d3748",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          "& p": {
            margin: 0,
            padding: 0,
            lineHeight: 1.5,
          },
          "& ul, & ol": {
            margin: "4px 0",
            paddingLeft: "40px",
            listStylePosition: "outside",
          },
          "& ol": {
            listStyleType: "decimal",
          },
          "& ul": {
            listStyleType: "disc",
          },
          "& li": {
            margin: "2px 0",
            paddingLeft: "4px",
          },
          ...(isDark && {
            "& *": {
              color: `${theme.palette.text.primary} !important`,
            },
            "& a": {
              color: `${theme.palette.primary.main} !important`,
            },
          }),
          "& strong": {
            fontWeight: 700,
            color: isDark ? theme.palette.text.primary : "#1a202c",
          },
          "& pre, & code": {
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          },
        }}
        dangerouslySetInnerHTML={{ __html: question.question }}
      />

      {/* ex count */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ color: isDark ? theme.palette.text.secondary : "#4a5568" }}
        >
          {question.ex?.length || 0}
        </Typography>
      </TableCell>

      {/* testcase count */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ color: isDark ? theme.palette.text.secondary : "#4a5568" }}
        >
          {question.testcase?.length || 0}
        </Typography>
      </TableCell>

      {/* echo_input */}
      <TableCell>
        <Chip
          label={question.echo_input ? "Có" : "Không"}
          size="small"
          sx={{
            fontWeight: 600,
            background: question.echo_input
              ? "linear-gradient(135deg, #38ef7d 0%, #11998e 100%)"
              : isDark
              ? "rgba(255,255,255,0.1)"
              : "#e0e0e0",
            color: question.echo_input
              ? "white"
              : isDark
              ? theme.palette.text.secondary
              : "#666",
          }}
        />
      </TableCell>

      {/* topic */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ color: isDark ? theme.palette.text.secondary : "#4a5568" }}
        >
          {question.topic}
        </Typography>
      </TableCell>

      {/* actions */}
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onAssign && (
            <IconButton
              onClick={() => onAssign(question)}
              sx={{
                background:
                  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                color: "white",
                width: 36,
                height: 36,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)",
                },
                transition: "all 0.2s ease",
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
            onClick={() => onDelete(question)}
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

QuestionRow.displayName = "QuestionRow";
export default QuestionRow;
