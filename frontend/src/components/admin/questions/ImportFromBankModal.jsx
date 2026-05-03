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
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  useTheme,
} from "@mui/material";
import { Search, Visibility } from "@mui/icons-material";
import useAdminAPI from "../../../hook/useAdminAPI";
import useCategoryAPI from "../../../hook/useCategoryAPI";

// Helper to strip HTML tags
const stripHtml = (html) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function ImportFromBankModal({
  open,
  onClose,
  targetLessonId,
  courseId,
  onSuccess,
}) {
  const api = useAdminAPI();
  const categoryApi = useCategoryAPI();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Toggle nguồn: "course" = Course Bank, "global" = Global Bank
  const [source, setSource] = useState("course");

  // Category filter
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Text search (giữ lại để tìm kiếm nội dung)
  const [searchText, setSearchText] = useState("");

  // Fetch categories khi source hoặc courseId thay đổi
  useEffect(() => {
    if (!open) return;
    const cid = source === "course" ? courseId : null;
    categoryApi
      .getCategories(cid)
      .then((res) => {
        setCategories(res.data.categories || []);
      })
      .catch(() => setCategories([]));
    setSelectedCategoryId(null);
  }, [source, courseId, open, categoryApi]);

  // Load questions từ Bank
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      if (source === "course" && courseId) {
        // Lấy từ Course Bank
        res = await api.getBankQuestions(null, courseId, selectedCategoryId);
      } else {
        // Lấy từ Global Bank
        res = await api.getBankQuestions(null, "null", selectedCategoryId);
      }
      setQuestions(res.data || []);
    } catch (error) {
      console.error("Lỗi tải câu hỏi từ ngân hàng", error);
    } finally {
      setLoading(false);
    }
  }, [api, source, courseId, selectedCategoryId]);

  useEffect(() => {
    if (open) {
      fetchQuestions();
      setSelectedIds([]);
    }
  }, [open, fetchQuestions]);

  // Reset khi mở lại
  useEffect(() => {
    if (open) {
      setSource(courseId ? "course" : "global");
      setSearchText("");
    }
  }, [open, courseId]);

  useEffect(() => {
    if (!open) {
      setPreviewOpen(false);
      setPreviewQuestion(null);
    }
  }, [open]);

  // Lọc theo text search (client-side)
  const filteredQuestions = questions.filter((q) => {
    if (!searchText.trim()) return true;
    const text = searchText.toLowerCase();
    const content = stripHtml(q.question).toLowerCase();
    const cat = (q.category || "").toLowerCase();
    const id = String(q.id).toLowerCase();
    return content.includes(text) || cat.includes(text) || id.includes(text);
  });

  useEffect(() => {
    if (!previewQuestion) return;
    const stillVisible = filteredQuestions.some((q) => q.id === previewQuestion.id);
    if (!stillVisible) {
      setPreviewOpen(false);
      setPreviewQuestion(null);
    }
  }, [filteredQuestions, previewQuestion]);

  // Handle Selection
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(filteredQuestions.map((q) => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleOpenPreview = (question) => {
    setPreviewQuestion(question);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewQuestion(null);
  };

  // Handle Import
  const handleImport = async () => {
    if (selectedIds.length === 0) return;

    try {
      setLoading(true);
      await api.assignQuestionsToLesson(selectedIds, targetLessonId, courseId);
      if (onSuccess) onSuccess(selectedIds.length);
      onClose();
    } catch (error) {
      console.error("Lỗi import câu hỏi", error);
      alert("Lỗi khi import câu hỏi: " + (error.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          background: theme.palette.gradient.primary,
          color: "white",
        }}
      >
        Lấy câu hỏi từ Ngân hàng
      </DialogTitle>
      <DialogContent dividers>
        {/* Toggle nguồn Bank */}
        {courseId && (
          <ToggleButtonGroup
            value={source}
            exclusive
            onChange={(e, val) => {
              if (val) setSource(val);
            }}
            size="small"
            sx={{ mb: 2, display: "flex" }}
          >
            <ToggleButton value="course" sx={{ flex: 1, textTransform: "none" }}>
              Từ ngân hàng khóa học
            </ToggleButton>
            <ToggleButton value="global" sx={{ flex: 1, textTransform: "none" }}>
              Từ ngân hàng chung
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        {/* Filter row */}
        <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
          {/* Category dropdown */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Danh mục</InputLabel>
            <Select
              value={selectedCategoryId || ""}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              label="Danh mục"
            >
              <MenuItem value="">Tất cả</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Text search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm theo nội dung, ID..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
        ) : filteredQuestions.length === 0 ? (
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
                        selectedIds.length < filteredQuestions.length
                      }
                      checked={
                        filteredQuestions.length > 0 &&
                        selectedIds.length === filteredQuestions.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Danh mục</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Câu hỏi</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90 }}>Xem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions.map((q) => {
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
                            color: theme.palette.primary.main,
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
                        {stripHtml(q.question)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Xem trước câu hỏi">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPreview(q);
                            }}
                            sx={{
                              color: theme.palette.primary.main,
                              backgroundColor:
                                previewQuestion?.id === q.id
                                  ? "rgba(102, 126, 234, 0.12)"
                                  : "transparent",
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
            background: theme.palette.gradient.primary,
            fontWeight: 700,
          }}
        >
          {loading
            ? "Đang Import..."
            : `Import (${selectedIds.length}) câu hỏi`}
        </Button>
      </DialogActions>

      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Xem trước câu hỏi {previewQuestion ? `#${previewQuestion.id}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          {previewQuestion ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  label={`ID: ${previewQuestion.id}`}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`Danh mục: ${previewQuestion.category || "—"}`}
                />
                <Chip
                  size="small"
                  label={`Testcase: ${previewQuestion.testcase?.length || 0}`}
                />
                {typeof previewQuestion.echo_input === "boolean" && (
                  <Chip
                    size="small"
                    label={`Hiển thị input: ${previewQuestion.echo_input ? "Bật" : "Tắt"}`}
                  />
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Nội dung câu hỏi
                </Typography>
                <Box
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    backgroundColor: "background.paper",
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      previewQuestion.question || "<p><em>Không có nội dung câu hỏi</em></p>",
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Danh sách testcase
                </Typography>
                {Array.isArray(previewQuestion.testcase) &&
                previewQuestion.testcase.length > 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {previewQuestion.testcase.map((tc, idx) => {
                      const input = tc?.input ?? tc?.stdin ?? "";
                      const expected =
                        tc?.expected_output ??
                        tc?.expectedOutput ??
                        tc?.output ??
                        tc?.result ??
                        "";

                      return (
                        <Paper
                          key={`${previewQuestion.id}_${idx}`}
                          variant="outlined"
                          sx={{ p: 1.5 }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 700, color: "text.secondary" }}
                          >
                            Testcase {idx + 1}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Đầu vào
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              mt: 0.5,
                              mb: 1,
                              p: 1,
                              borderRadius: 1,
                              bgcolor: "action.hover",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              fontFamily: "monospace",
                            }}
                          >
                            {input || "(rỗng)"}
                          </Box>

                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Kết quả mong đợi
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              mt: 0.5,
                              mb: 0,
                              p: 1,
                              borderRadius: 1,
                              bgcolor: "action.hover",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              fontFamily: "monospace",
                            }}
                          >
                            {expected || "(rỗng)"}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Câu hỏi này chưa có testcase.
                  </Typography>
                )}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePreview} variant="outlined">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
