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
            <Table sx={{ tableLayout: "fixed" }}>
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
            boxShadow: theme.palette.mode === "dark" 
              ? "0 8px 32px rgba(0, 0, 0, 0.3)"
              : "0 8px 32px rgba(0, 0, 0, 0.1)",
            backgroundColor: theme.palette.background.paper,
          }}
        >
        <TableContainer>
          <Table sx={{ tableLayout: "fixed" }}>
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
                    width: "8%",
                  }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    width: "10%",
                  }}
                >
                  Category
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    width: "32%",
                  }}
                >
                  Câu hỏi
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    width: "5%",
                  }}
                >
                  EX
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    width: "8%",
                  }}
                >
                  Testcase
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    width: "10%",
                  }}
                >
                  Echo Input
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    width: "12%",
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
                    width: "15%",
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
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
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
