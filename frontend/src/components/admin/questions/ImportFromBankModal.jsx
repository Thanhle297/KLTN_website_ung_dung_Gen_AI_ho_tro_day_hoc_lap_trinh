import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  InputAdornment,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import useAdminAPI from "../../../hook/useAdminAPI";

export default function ImportFromBankModal({
  open,
  onClose,
  targetLessonId,
  onSuccess,
}) {
  const api = useAdminAPI();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Load questions from Bank
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getBankQuestions(categoryFilter);
      setQuestions(res.data);
    } catch (error) {
      console.error("Failed to load bank questions", error);
    } finally {
      setLoading(false);
    }
  }, [api, categoryFilter]);

  useEffect(() => {
    if (open) {
      fetchQuestions();
      setSelectedIds([]); // Reset selection on open
    }
  }, [open, fetchQuestions]);

  // Handle Selection
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(questions.map((q) => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  // Handle Import
  const handleImport = async () => {
    if (selectedIds.length === 0) return;

    try {
      setLoading(true);
      await api.assignQuestionsToLesson(selectedIds, targetLessonId);
      if (onSuccess) onSuccess(selectedIds.length);
      onClose();
    } catch (error) {
      console.error("Failed to import questions", error);
      // Optional: show error toast?
      alert("Lỗi khi import câu hỏi: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        🏦 Lấy câu hỏi từ Ngân hàng
      </DialogTitle>
      <DialogContent dividers>
        {/* Filter */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm theo danh mục (Category) hoặc nội dung..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* List */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : questions.length === 0 ? (
          <Typography align="center" color="textSecondary" sx={{ py: 4 }}>
            Không tìm thấy câu hỏi nào trong ngân hàng.
          </Typography>
        ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ maxHeight: 400 }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedIds.length > 0 &&
                        selectedIds.length < questions.length
                      }
                      checked={
                        questions.length > 0 &&
                        selectedIds.length === questions.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Câu hỏi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.map((q) => {
                  const isSelected = selectedIds.includes(q.id);
                  return (
                    <TableRow
                      key={q.id}
                      hover
                      onClick={() => handleSelectOne(q.id)}
                      role="checkbox"
                      aria-checked={isSelected}
                      selected={isSelected}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell>{q.id}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            py: 0.5,
                            bgcolor: "rgba(102, 126, 234, 0.1)",
                            color: "#667eea",
                            borderRadius: 1,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          {q.category || "—"}
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 300,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {q.question}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Hủy bỏ
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={loading || selectedIds.length === 0}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontWeight: 700,
          }}
        >
          {loading
            ? "Đang Import..."
            : `Import (${selectedIds.length}) câu hỏi`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
