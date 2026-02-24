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
import QuestionRow from "./QuestionRow";

const QuestionsTable = React.memo(
  ({ questions, loading, selectedSubLesson, onEdit, onDelete, onAssign }) => {
    const theme = useTheme();
    const isBankMode = selectedSubLesson === "BANK";

    if (!selectedSubLesson) {
      return (
<Paper
          sx={{
            borderRadius: 4,
            p: 8,
            textAlign: "center",
            boxShadow: theme.palette.mode === "dark" 
              ? "0 8px 32px rgba(0, 0, 0, 0.3)"
              : "0 8px 32px rgba(0, 0, 0, 0.1)",
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            📚 Hãy chọn SubLesson để xem câu hỏi
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
                color: theme.palette.primary.main,
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
            boxShadow: theme.palette.mode === "dark" 
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
                  background: theme.palette.mode === "dark"
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`
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
                  Category
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Câu hỏi
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  EX
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Testcase
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Echo Input
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Topic
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
              {questions.map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAssign={isBankMode ? onAssign : null}
                />
              ))}

              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      😔 Không có câu hỏi nào
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

QuestionsTable.displayName = "QuestionsTable";

export default QuestionsTable;
