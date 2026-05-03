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
  FormControlLabel,
  CircularProgress,
  Alert,
  useTheme,
} from "@mui/material";
import { toast } from "sonner";
import useAdminAPI from "../../../hook/useAdminAPI";
import useCategoryAPI from "../../../hook/useCategoryAPI";

const CopyFromCourseModal = ({
  open,
  onClose,
  targetCourseId,
  courses,
  onSuccess,
}) => {
  const theme = useTheme();
  const api = useAdminAPI();
  const categoryApi = useCategoryAPI();

  const [sourceCourseId, setSourceCourseId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [copyCategories, setCopyCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);

  // Reset khi mở
  useEffect(() => {
    if (open) {
      setSourceCourseId("");
      setQuestions([]);
      setCategories([]);
      setFilterCategoryId("");
      setSelectedIds([]);
    }
  }, [open]);

  // Load danh mục khi chọn khóa nguồn
  const loadCategories = useCallback(async () => {
    if (!sourceCourseId) return;
    try {
      const catRes = await categoryApi.getCategories(sourceCourseId);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error("Lỗi tải danh mục khóa nguồn:", err);
    }
  }, [categoryApi, sourceCourseId]);

  // Lấy câu hỏi khi khóa nguồn hoặc filter thay đổi
  const loadQuestions = useCallback(async () => {
    if (!sourceCourseId) return;
    setLoading(true);
    try {
      const qRes = await api.getBankQuestions(null, sourceCourseId, filterCategoryId || undefined);
      setQuestions(qRes.data || []);
    } catch (err) {
      console.error("Lỗi tải câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  }, [api, sourceCourseId, filterCategoryId]);

  useEffect(() => {
    if (sourceCourseId) {
      loadCategories();
      setFilterCategoryId(""); // Reset filter khi đổi khóa
    } else {
      setCategories([]);
    }
  }, [sourceCourseId, loadCategories]);

  useEffect(() => {
    if (sourceCourseId) {
      loadQuestions();
      setSelectedIds([]); // Reset selection khi đổi filter/course
    } else {
      setQuestions([]);
    }
  }, [sourceCourseId, filterCategoryId, loadQuestions]);

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

  // Copy
  const handleCopy = async () => {
    if (!selectedIds.length || !sourceCourseId) return;
    setCopying(true);
    try {
      const res = await api.copyBetweenCourses(
        selectedIds,
        sourceCourseId,
        targetCourseId,
        copyCategories
      );
      const data = res.data;
      toast.success(
        `Đã sao chép ${data.copied} câu hỏi` +
          (data.categoriesCreated > 0
            ? `, tạo ${data.categoriesCreated} danh mục mới`
            : "")
      );
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi sao chép câu hỏi");
    } finally {
      setCopying(false);
    }
  };

  // Strip HTML helper
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  // Lọc courses: bỏ khóa đích
  const availableCourses = (courses || []).filter(
    (c) => c.courseId !== targetCourseId
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background: theme.palette.gradient.primary,
          color: "white",
          fontWeight: 700,
        }}
      >
        Sao chép câu hỏi từ khóa khác
      </DialogTitle>

      <DialogContent dividers>
        {/* Selectors */}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel>Khóa nguồn</InputLabel>
            <Select
              value={sourceCourseId}
              onChange={(e) => setSourceCourseId(e.target.value)}
              label="Khóa nguồn"
            >
              {availableCourses.map((c) => (
                <MenuItem key={c.courseId} value={c.courseId}>
                  {c.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {categories.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                label="Danh mục"
              >
                <MenuItem value="">Tất cả danh mục</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Questions table */}
        {!sourceCourseId ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Hãy chọn khóa nguồn để xem câu hỏi
          </Typography>
        ) : loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 350 }}>
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
                        Khóa nguồn không có câu hỏi nào
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

        {/* Options */}
        <FormControlLabel
          control={
            <Checkbox
              checked={copyCategories}
              onChange={(e) => setCopyCategories(e.target.checked)}
            />
          }
          label="Sao chép cả danh mục (tự động tạo nếu chưa có)"
          sx={{ mt: 1 }}
        />

        <Alert severity="info" sx={{ mt: 1 }}>
          Câu hỏi sẽ được sao chép hoàn toàn độc lập. Chỉnh sửa sau này không
          ảnh hưởng khóa gốc.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={handleCopy}
          disabled={!selectedIds.length || copying}
          sx={{ textTransform: "none" }}
        >
          {copying
            ? "Đang sao chép..."
            : `Sao chép ${selectedIds.length} câu hỏi`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(CopyFromCourseModal);
