import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from "@mui/material";
import {
  Add,
  Download,
  ContentCopy,
  Upload,
  Settings,
  AccountBalance,
  PlaylistAdd,
} from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";
import useCategoryAPI from "../../hook/useCategoryAPI";
import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import QuestionsTable from "../../components/admin/questions/QuestionsTable";
import QuestionFormDialog from "../../components/admin/questions/QuestionFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";
import DistributeModal from "../../components/admin/questions/DistributeModal";
import CategoryManager from "../../components/admin/categories/CategoryManager";
import ImportFromCourseLessonsModal from "../../components/admin/questions/ImportFromCourseLessonsModal";
import ImportFromGlobalModal from "../../components/admin/questions/ImportFromGlobalModal";
import CopyFromCourseModal from "../../components/admin/questions/CopyFromCourseModal";
import PromoteToGlobalModal from "../../components/admin/questions/PromoteToGlobalModal";
import { gradientButtonSx } from "../../styles/adminTokens";
import { sortCategoriesByName } from "../../utils/categorySort";

export default function QuestionBank() {
  const api = useAdminAPI();
  const categoryApi = useCategoryAPI();
  const notify = useNotify();
  const theme = useTheme();

  // Lấy user từ localStorage
  const user = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch {
      return null;
    }
  }, []);

  // === Core state ===
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // === Course + Category state ===
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null); // null = global
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // === Multi-select ===
  const [selectedIds, setSelectedIds] = useState([]);

  // === Modal state ===
  const [openDistribute, setOpenDistribute] = useState(false);
  const [openCategoryManager, setOpenCategoryManager] = useState(false);
  const [openImportLessons, setOpenImportLessons] = useState(false);
  const [openImportGlobal, setOpenImportGlobal] = useState(false);
  const [openCopyFromCourse, setOpenCopyFromCourse] = useState(false);
  const [openPromote, setOpenPromote] = useState(false);

  // Computed
  const isCourseBank = selectedCourseId !== null;
  const hasSelection = selectedIds.length > 0;
  const isAdmin = user?.role === "admin";

  /* ================= LOAD COURSES ================= */
  useEffect(() => {
    api
      .getCourses()
      .then((res) => setCourses(res.data || []))
      .catch(() => {});
  }, [api]);

  /* ================= LOAD CATEGORIES ================= */
  const loadCategories = useCallback(async () => {
    try {
      const res = await categoryApi.getCategories(selectedCourseId);
      setCategories(sortCategoriesByName(res.data.categories || []));
    } catch {
      setCategories([]);
    }
  }, [categoryApi, selectedCourseId]);

  useEffect(() => {
    loadCategories();
    setSelectedCategoryId(null);
    setSelectedIds([]);
  }, [selectedCourseId, loadCategories]);

  /* ================= LOAD QUESTIONS ================= */
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getBankQuestions(
        null, // category text (không dùng nữa)
        selectedCourseId === null ? "null" : selectedCourseId,
        selectedCategoryId
      );

      const unique = Array.from(
        new Map(res.data.map((q) => [q.id, q])).values()
      );
      setQuestions(unique);
    } catch {
      notify.error("Lỗi tải ngân hàng câu hỏi");
    } finally {
      setLoading(false);
    }
  }, [api, selectedCourseId, selectedCategoryId, notify]);

  useEffect(() => {
    loadQuestions();
    setPage(0);
  }, [loadQuestions]);

  const refreshBank = useCallback(() => {
    loadCategories();
    loadQuestions();
  }, [loadCategories, loadQuestions]);

  /* ================= COURSE CHANGE ================= */
  const handleCourseChange = useCallback((e) => {
    const val = e.target.value;
    setSelectedCourseId(val === "__global__" ? null : val);
  }, []);

  /* ================= CATEGORY FILTER ================= */
  const handleCategoryFilter = useCallback(
    (catId) => {
      setSelectedCategoryId((prev) => (prev === catId ? null : catId));
    },
    []
  );

  /* ================= CHECKBOX ================= */
  const handleSelectAll = useCallback(() => {
    setSelectedIds((prevSelected) => {
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const currentPage = questions.slice(startIndex, endIndex);
      if (prevSelected.length === currentPage.length) {
        return [];
      } else {
        return currentPage.map((q) => q.id);
      }
    });
  }, [questions, page, rowsPerPage]);

  const handleSelectOne = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  /* ================= FORM ================= */
  const handleAddClick = useCallback(() => {
    setEditing(null);
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((question) => {
    setEditing(question);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  /* ================= SAVE ================= */
  const handleSave = useCallback(
    async (formData) => {
      if (!formData.question) {
        notify.warning("Thiếu câu hỏi");
        return;
      }

      const payload = {
        ...formData,
        isBank: true,
        courseId: selectedCourseId,
        lessonId: null,
        topic: formData.category || "Bank",
      };

      try {
        if (editing) {
          await api.updateQuestion(editing.id, payload);
          notify.success("Cập nhật thành công");
        } else {
          await api.createQuestion(payload);
          notify.success("Thêm vào ngân hàng thành công");
        }

        setOpenDialog(false);
        refreshBank();
      } catch (err) {
        console.error(err);
        notify.error("Lỗi lưu câu hỏi");
      }
    },
    [editing, api, notify, refreshBank, selectedCourseId]
  );

  /* ================= DELETE ================= */
  const handleDeleteClick = useCallback((question) => {
    setDeleteTarget(question);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteQuestion(deleteTarget.id);
      notify.success("Xóa thành công");
      setDeleteTarget(null);
      loadQuestions();
    } catch {
      notify.error("Lỗi xóa câu hỏi");
    }
  }, [deleteTarget, api, notify, loadQuestions]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ================= DISTRIBUTE (single) ================= */
  const handleAssignClick = useCallback((question) => {
    setSelectedIds([question.id]);
    setOpenDistribute(true);
  }, []);

  const handleDistributeSuccess = useCallback(() => {
    notify.success("Đã phân phối câu hỏi thành công");
  }, [notify]);

  /* ================= BULK DISTRIBUTE ================= */
  const handleBulkDistribute = useCallback(() => {
    setOpenDistribute(true);
  }, []);

  /* ================= PAGINATION ================= */
  const paginatedQuestions = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return questions.slice(startIndex, endIndex);
  }, [questions, page, rowsPerPage]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return (
    <AdminPageWrapper>
      {/* HEADER */}
      <AdminPageHeader
        icon={<AccountBalance />}
        title="Ngân hàng câu hỏi"
        subtitle="Quản lý kho câu hỏi tập trung và phân phối về bài học"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddClick}
            sx={gradientButtonSx(theme)}
          >
            Tạo câu hỏi
          </Button>
        }
      />

      {/* COURSE SELECTOR */}
      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel>Khóa học</InputLabel>
            <Select
              value={selectedCourseId === null ? "__global__" : selectedCourseId}
              onChange={handleCourseChange}
              label="Khóa học"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="__global__">Ngân hàng chung (Global)</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c.courseId} value={c.courseId}>
                  {c.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Category chips */}
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", flex: 1 }}>
            <Chip
              label="Tất cả"
              size="small"
              variant={selectedCategoryId === null ? "filled" : "outlined"}
              color={selectedCategoryId === null ? "primary" : "default"}
              onClick={() => setSelectedCategoryId(null)}
              sx={{ fontWeight: 600 }}
            />
            {categories.map((cat) => (
              <Chip
                key={cat._id}
                label={cat.name}
                size="small"
                variant={
                  selectedCategoryId === cat._id ? "filled" : "outlined"
                }
                color={
                  selectedCategoryId === cat._id ? "primary" : "default"
                }
                onClick={() => handleCategoryFilter(cat._id)}
                sx={{ fontWeight: 500 }}
              />
            ))}
          </Box>

          {/* Quản lý danh mục */}
          <Button
            startIcon={<Settings />}
            size="small"
            onClick={() => setOpenCategoryManager(true)}
            sx={{ textTransform: "none", borderRadius: 2, whiteSpace: "nowrap" }}
          >
            Quản lý danh mục
          </Button>
        </Stack>
      </Paper>

      {/* ACTION TOOLBAR (Course Bank specific) */}
      {isCourseBank && (
        <Paper sx={{ p: 1.5, borderRadius: 3, mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              startIcon={<PlaylistAdd />}
              size="small"
              variant="outlined"
              onClick={() => setOpenImportLessons(true)}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Lấy từ bài học
            </Button>
            <Button
              startIcon={<Download />}
              size="small"
              variant="outlined"
              onClick={() => setOpenImportGlobal(true)}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Import từ Ngân hàng chung
            </Button>
            <Button
              startIcon={<ContentCopy />}
              size="small"
              variant="outlined"
              onClick={() => setOpenCopyFromCourse(true)}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Sao chép từ khóa khác
            </Button>
            {isAdmin && hasSelection && (
              <Button
                startIcon={<Upload />}
                size="small"
                variant="outlined"
                color="secondary"
                onClick={() => setOpenPromote(true)}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                Đẩy lên Ngân hàng chung ({selectedIds.length})
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* BULK ACTIONS BAR */}
      {hasSelection && (
        <Paper
          sx={{
            p: 1.5,
            borderRadius: 3,
            mb: 2,
            backgroundColor: theme.palette.action.selected,
            border: "1px solid",
            borderColor: "primary.main",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" fontWeight={600}>
              Đã chọn: {selectedIds.length} câu hỏi
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={handleBulkDistribute}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Phân phối
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => setSelectedIds([])}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Bỏ chọn
            </Button>
          </Stack>
        </Paper>
      )}

      {/* TABLE */}
      <QuestionsTable
        questions={paginatedQuestions}
        loading={loading}
        selectedSubLesson="BANK"
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onAssign={handleAssignClick}
        selectable
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
      />

      {/* Pagination */}
      {!loading && questions.length > 0 && (
        <Paper sx={{ borderRadius: 3, mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={questions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số câu hỏi mỗi trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} của ${count} câu hỏi`
            }
            sx={{
              ".MuiTablePagination-toolbar": {
                backgroundColor: "rgba(33, 150, 243, 0.05)",
              },
            }}
          />
        </Paper>
      )}

      {/* DIALOGS */}
      <QuestionFormDialog
        open={openDialog}
        editing={editing}
        onClose={handleCloseDialog}
        onSave={handleSave}
        courseId={selectedCourseId}
        categories={categories}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={`Câu hỏi ID: ${deleteTarget?.id || ""}`}
        itemType="câu hỏi"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <DistributeModal
        open={openDistribute}
        onClose={() => setOpenDistribute(false)}
        selectedQuestionIds={selectedIds}
        sourceCourseId={selectedCourseId}
        onSuccess={handleDistributeSuccess}
      />

      <CategoryManager
        open={openCategoryManager}
        onClose={() => {
          setOpenCategoryManager(false);
          loadCategories(); // Refresh categories khi đóng
        }}
        courseId={selectedCourseId}
      />

      {/* Lấy câu hỏi từ bài học trong cùng khóa */}
      <ImportFromCourseLessonsModal
        open={openImportLessons}
        onClose={() => setOpenImportLessons(false)}
        targetCourseId={selectedCourseId}
        onSuccess={refreshBank}
      />

      {/* Import từ Global Bank */}
      <ImportFromGlobalModal
        open={openImportGlobal}
        onClose={() => setOpenImportGlobal(false)}
        targetCourseId={selectedCourseId}
        onSuccess={refreshBank}
      />

      {/* Sao chép từ khóa khác */}
      <CopyFromCourseModal
        open={openCopyFromCourse}
        onClose={() => setOpenCopyFromCourse(false)}
        targetCourseId={selectedCourseId}
        courses={courses}
        onSuccess={refreshBank}
      />

      {/* Đẩy lên Global Bank */}
      <PromoteToGlobalModal
        open={openPromote}
        onClose={() => {
          setOpenPromote(false);
          setSelectedIds([]);
        }}
        selectedQuestionIds={selectedIds}
        sourceCourseId={selectedCourseId}
        questions={questions.filter((q) => selectedIds.includes(q.id))}
        onSuccess={loadQuestions}
      />
    </AdminPageWrapper>
  );
}
