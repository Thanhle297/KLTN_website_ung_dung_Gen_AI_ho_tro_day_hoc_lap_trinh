import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { toast } from "sonner";
import useAdminAPI from "../../../hook/useAdminAPI";

const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
};

const ImportFromCourseLessonsModal = ({
  open,
  onClose,
  targetCourseId,
  onSuccess,
}) => {
  const api = useAdminAPI();
  const theme = useTheme();
  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadQuestions = useCallback(async () => {
    if (!targetCourseId) {
      setQuestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.getCourseLessonQuestionsForBank(targetCourseId);
      setQuestions(res.data || []);
    } catch (err) {
      console.error("Lỗi tải câu hỏi bài học:", err);
      toast.error(err.response?.data?.message || "Lỗi tải câu hỏi bài học");
    } finally {
      setLoading(false);
    }
  }, [api, targetCourseId]);

  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setSearchText("");
    loadQuestions();
  }, [open, loadQuestions]);

  const filteredQuestions = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return questions;

    return questions.filter((q) => {
      const content = stripHtml(q.question).toLowerCase();
      const category = (q.category || "").toLowerCase();
      const lessonId = String(q.lessonId || "").toLowerCase();
      const id = String(q.id).toLowerCase();
      return (
        content.includes(keyword) ||
        category.includes(keyword) ||
        lessonId.includes(keyword) ||
        id.includes(keyword)
      );
    });
  }, [questions, searchText]);

  const filteredIds = useMemo(
    () => filteredQuestions.map((q) => q.id),
    [filteredQuestions]
  );

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const partiallySelected =
    filteredIds.some((id) => selectedIds.includes(id)) && !allFilteredSelected;

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (!selectedIds.length || !targetCourseId) return;

    setImporting(true);
    try {
      const res = await api.importCourseLessonQuestionsToBank(
        selectedIds,
        targetCourseId
      );
      const { imported, skipped } = res.data;
      toast.success(
        `Đã lấy ${imported} câu hỏi vào ngân hàng` +
          (skipped > 0 ? `, bỏ qua ${skipped} câu đã có` : "")
      );
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lấy câu hỏi vào ngân hàng");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background: theme.palette.gradient.primary,
          color: "white",
          fontWeight: 700,
        }}
      >
        Lấy câu hỏi từ bài học
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm theo nội dung, ID, danh mục hoặc bài học..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allFilteredSelected}
                      indeterminate={partiallySelected}
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Bài học</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Danh mục</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Câu hỏi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        Không có câu hỏi bài học nào cần lấy vào ngân hàng
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((q) => (
                    <TableRow
                      key={q.id}
                      hover
                      selected={selectedIds.includes(q.id)}
                      onClick={() => handleSelectOne(q.id)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(q.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleSelectOne(q.id)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{q.id}</TableCell>
                      <TableCell>{q.lessonId || "—"}</TableCell>
                      <TableCell>{q.category || "—"}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 340,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {stripHtml(q.question)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Câu hỏi được sao chép độc lập vào ngân hàng khóa học. Câu hỏi gốc
          trong bài học vẫn được giữ nguyên.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!selectedIds.length || importing}
          sx={{ textTransform: "none" }}
        >
          {importing ? "Đang lấy..." : `Lấy ${selectedIds.length} câu hỏi`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(ImportFromCourseLessonsModal);
