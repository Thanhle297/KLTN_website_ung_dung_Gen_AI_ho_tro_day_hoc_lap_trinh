import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
} from "@mui/material";
import { toast } from "sonner";
import useAdminAPI from "../../../hook/useAdminAPI";
import useCategoryAPI from "../../../hook/useCategoryAPI";

const ImportFromGlobalModal = ({ open, onClose, targetCourseId, onSuccess }) => {
  const theme = useTheme();
  const api = useAdminAPI();
  const categoryApi = useCategoryAPI();

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch categories (chỉ cần chạy 1 lần khi mở)
  const loadCategories = useCallback(async () => {
    try {
      const catRes = await categoryApi.getCategories(null); // Global categories
      setGlobalCategories(catRes.data.categories || []);
    } catch (err) {
      console.error("Lỗi tải danh mục chung:", err);
    }
  }, [categoryApi]);

  // Fetch questions (chạy khi mở hoặc khi đổi filter)
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const qRes = await api.getBankQuestions(null, "null", filterCategoryId || undefined);
      setQuestions(qRes.data || []);
    } catch (err) {
      console.error("Lỗi tải câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  }, [api, filterCategoryId]);

  useEffect(() => {
    if (open) {
      loadCategories();
      setSelectedIds([]);
      setFilterCategoryId(""); // Reset filter
    }
  }, [open, loadCategories]);

  useEffect(() => {
    if (open) {
      loadQuestions();
    }
  }, [open, loadQuestions]);

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Import
  const handleImport = async () => {
    if (!selectedIds.length) return;
    setImporting(true);
    try {
      const res = await api.importToCourseBank(selectedIds, targetCourseId);
      const data = res.data;
      toast.success(
        `Đã import ${data.imported} câu hỏi` +
          (data.categoriesCreated > 0
            ? `, tạo ${data.categoriesCreated} danh mục mới`
            : "")
      );
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi import câu hỏi");
    } finally {
      setImporting(false);
    }
  };

  // Strip HTML helper
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
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
        Import từ Ngân hàng chung
      </DialogTitle>

      <DialogContent dividers>
        {/* Filter */}
        <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel>Danh mục</InputLabel>
          <Select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            label="Danh mục"
          >
            <MenuItem value="">Tất cả danh mục</MenuItem>
            {globalCategories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
                      checked={
                        selectedIds.length === questions.length &&
                        questions.length > 0
                      }
                      indeterminate={
                        selectedIds.length > 0 &&
                        selectedIds.length < questions.length
                      }
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Danh mục</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Câu hỏi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        Không có câu hỏi nào trong ngân hàng chung
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((q) => (
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
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{q.id}</TableCell>
                      <TableCell>{q.category || "—"}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 300,
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
          Câu hỏi sẽ được sao chép vào ngân hàng khóa học. Danh mục tương ứng
          sẽ được tạo tự động nếu chưa tồn tại.
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
          {importing
            ? "Đang import..."
            : `Import ${selectedIds.length} câu hỏi`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(ImportFromGlobalModal);
