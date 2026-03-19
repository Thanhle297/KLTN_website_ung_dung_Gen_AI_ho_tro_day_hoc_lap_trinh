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
  useTheme,
} from "@mui/material";
import { Search } from "@mui/icons-material";
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

  // Lọc theo text search (client-side)
  const filteredQuestions = questions.filter((q) => {
    if (!searchText.trim()) return true;
    const text = searchText.toLowerCase();
    const content = stripHtml(q.question).toLowerCase();
    const cat = (q.category || "").toLowerCase();
    const id = String(q.id).toLowerCase();
    return content.includes(text) || cat.includes(text) || id.includes(text);
  });

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
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                        {stripHtml(q.question)}
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
