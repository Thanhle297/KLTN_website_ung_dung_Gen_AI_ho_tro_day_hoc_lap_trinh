import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import useCategoryAPI from "../../../hook/useCategoryAPI";
import useAdminAPI from "../../../hook/useAdminAPI";

const CategoryManager = ({ open, onClose, courseId }) => {
  const theme = useTheme();
  const categoryApi = useCategoryAPI();
  const adminApi = useAdminAPI();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Copy dialog state
  const [openCopyDialog, setOpenCopyDialog] = useState(false);
  const [sourceCourseId, setSourceCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [copyLoading, setCopyLoading] = useState(false);

  // Lấy danh sách categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getCategories(courseId);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Lỗi lấy danh mục:", err);
      setError("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  }, [categoryApi, courseId]);

  useEffect(() => {
    if (open) {
      loadCategories();
      setError("");
      setSuccess("");
    }
  }, [open, loadCategories]);

  // Lấy courses cho copy dialog
  const loadCourses = useCallback(async () => {
    try {
      const res = await adminApi.getCourses();
      setCourses(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy khóa học:", err);
    }
  }, [adminApi]);

  useEffect(() => {
    if (openCopyDialog) {
      loadCourses();
    }
  }, [openCopyDialog, loadCourses]);

  // Thêm danh mục
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setError("");
    try {
      await categoryApi.createCategory({
        courseId: courseId || null,
        name: newName.trim(),
      });
      setNewName("");
      setSuccess("Tạo danh mục thành công");
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tạo danh mục");
    }
  };

  // Sửa danh mục
  const handleStartEdit = (cat) => {
    setEditingId(cat._id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) return;
    setError("");
    try {
      await categoryApi.updateCategory(editingId, { name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      setSuccess("Cập nhật danh mục thành công");
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi cập nhật danh mục");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Xóa danh mục
  const handleDelete = async (cat) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    setError("");
    try {
      await categoryApi.deleteCategory(cat._id);
      setSuccess("Xóa danh mục thành công");
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi xóa danh mục");
    }
  };

  // Sao chép danh mục từ khóa khác
  const handleCopy = async () => {
    if (!sourceCourseId) return;
    setCopyLoading(true);
    setError("");
    try {
      const res = await categoryApi.copyCategories(sourceCourseId, courseId);
      setSuccess(
        `Đã tạo ${res.data.created} danh mục, bỏ qua ${res.data.skipped} danh mục trùng`
      );
      setOpenCopyDialog(false);
      setSourceCourseId("");
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi sao chép danh mục");
    } finally {
      setCopyLoading(false);
    }
  };

  const title = courseId
    ? "Quản lý danh mục — Khóa học"
    : "Quản lý danh mục — Ngân hàng chung";

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: 700,
          }}
        >
          {title}
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên danh mục</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        Chưa có danh mục nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat, index) => (
                    <TableRow key={cat._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {editingId === cat._id ? (
                          <TextField
                            size="small"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            autoFocus
                            fullWidth
                          />
                        ) : (
                          <Chip label={cat.name} size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingId === cat._id ? (
                          <>
                            <Tooltip title="Lưu">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={handleSaveEdit}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hủy">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={handleCancelEdit}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Sửa">
                              <IconButton
                                size="small"
                                onClick={() => handleStartEdit(cat)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(cat)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Thêm danh mục mới */}
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <TextField
              size="small"
              placeholder="Tên danh mục mới..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!newName.trim()}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                minWidth: 120,
              }}
            >
              + Thêm
            </Button>
          </Box>

          {/* Nút sao chép từ khóa khác (chỉ hiện cho Course Bank) */}
          {courseId && (
            <Button
              startIcon={<ContentCopyIcon />}
              onClick={() => setOpenCopyDialog(true)}
              sx={{ mt: 2, textTransform: "none", borderRadius: 2 }}
            >
              Sao chép danh mục từ khóa khác
            </Button>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={onClose}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sub-dialog: Sao chép danh mục */}
      <Dialog
        open={openCopyDialog}
        onClose={() => setOpenCopyDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Sao chép danh mục từ khóa khác</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Chọn khóa nguồn</InputLabel>
            <Select
              value={sourceCourseId}
              onChange={(e) => setSourceCourseId(e.target.value)}
              label="Chọn khóa nguồn"
            >
              {/* Option: Global Bank */}
              <MenuItem value="null">Ngân hàng chung (Global)</MenuItem>
              {courses
                .filter((c) => c.courseId !== courseId)
                .map((c) => (
                  <MenuItem key={c.courseId} value={c.courseId}>
                    {c.title}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCopyDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleCopy}
            disabled={!sourceCourseId || copyLoading}
          >
            {copyLoading ? "Đang sao chép..." : "Sao chép"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default React.memo(CategoryManager);
