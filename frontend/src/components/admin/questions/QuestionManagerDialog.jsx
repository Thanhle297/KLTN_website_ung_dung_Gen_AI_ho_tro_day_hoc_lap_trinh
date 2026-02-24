// src/components/admin/questions/QuestionManagerDialog.jsx
// Dialog quản lý câu hỏi của một SubLesson
// Cho phép xem, thêm, sửa, xóa và import câu hỏi từ ngân hàng

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
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  useTheme,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CloudDownload,
  Close,
  DragIndicator,
} from "@mui/icons-material";

// Drag and Drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import useAdminAPI from "../../../hook/useAdminAPI";
import QuestionFormDialog from "./QuestionFormDialog";
import ImportFromBankModal from "./ImportFromBankModal";
import DeleteConfirmDialog from "../shared/DeleteConfirmDialog";

// Helper để strip HTML tags
const stripHtml = (html) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Helper để truncate text
const truncate = (text, maxLength = 80) => {
  if (!text) return "";
  const stripped = stripHtml(text);
  return stripped.length > maxLength
    ? stripped.substring(0, maxLength) + "..."
    : stripped;
};

/**
 * Dialog quản lý câu hỏi của một SubLesson
 */
export default function QuestionManagerDialog({
  open,
  subLesson,
  courseId,
  onClose,
  onQuestionsChanged,
}) {
  const api = useAdminAPI();
  const theme = useTheme();

  // State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [questionDialog, setQuestionDialog] = useState({
    open: false,
    editing: null,
  });
  const [importModal, setImportModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load questions khi dialog mở
  const loadQuestions = useCallback(async () => {
    if (!subLesson?.lessonId || !courseId) return;

    try {
      setLoading(true);
      const res = await api.getQuestions(subLesson.lessonId, courseId);
      // Sắp xếp theo order hoặc id
      const sorted = [...res.data].sort(
        (a, b) => (a.order ?? a.id) - (b.order ?? b.id)
      );
      setQuestions(sorted);
    } catch (err) {
      console.error("❌ Lỗi tải câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  }, [api, subLesson?.lessonId, courseId]);

  useEffect(() => {
    if (open && subLesson) {
      loadQuestions();
    }
  }, [open, subLesson, loadQuestions]);

  // ==================== HANDLERS ====================

  const handleAddQuestion = useCallback(() => {
    setQuestionDialog({ open: true, editing: null });
  }, []);

  const handleEditQuestion = useCallback((question) => {
    setQuestionDialog({ open: true, editing: question });
  }, []);

  const handleDeleteClick = useCallback((question) => {
    setDeleteTarget(question);
  }, []);

  const handleSaveQuestion = useCallback(
    async (formData) => {
      try {
        setSaving(true);

        if (questionDialog.editing) {
          // Update
          await api.updateQuestion(questionDialog.editing.id, formData);
        } else {
          // Create - thêm lessonId và courseId
          await api.createQuestion({
            ...formData,
            lessonId: subLesson.lessonId,
            courseId: courseId,
          });
        }

        setQuestionDialog({ open: false, editing: null });
        loadQuestions();

        // Notify parent to refresh question count
        if (onQuestionsChanged) onQuestionsChanged();
      } catch (err) {
        console.error("❌ Lỗi lưu câu hỏi:", err);
        alert("Lỗi khi lưu câu hỏi: " + (err.message || "Unknown error"));
      } finally {
        setSaving(false);
      }
    },
    [
      questionDialog.editing,
      api,
      subLesson?.lessonId,
      courseId,
      loadQuestions,
      onQuestionsChanged,
    ]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      setSaving(true);
      await api.deleteQuestion(deleteTarget.id);
      setDeleteTarget(null);
      loadQuestions();

      // Notify parent to refresh question count
      if (onQuestionsChanged) onQuestionsChanged();
    } catch (err) {
      console.error("❌ Lỗi xóa câu hỏi:", err);
      alert("Lỗi khi xóa câu hỏi: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, api, loadQuestions, onQuestionsChanged]);

  const handleImportSuccess = useCallback(
    (count) => {
      loadQuestions();
      if (onQuestionsChanged) onQuestionsChanged();
    },
    [loadQuestions, onQuestionsChanged]
  );

  // ==================== DRAG & DROP ====================

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleQuestionDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newQuestions);

      // Lưu thứ tự mới lên server
      try {
        const questionIds = newQuestions.map((q) => q.id);
        await api.reorderQuestions(questionIds);
      } catch (err) {
        console.error("❌ Lỗi cập nhật thứ tự câu hỏi:", err);
        // Rollback
        loadQuestions();
      }
    },
    [questions, api, loadQuestions]
  );

  // ==================== RENDER ====================

  if (!subLesson) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        disableRestoreFocus
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            minHeight: "60vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`
              : "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: "1.3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>📝</span>
            <span>
              Quản lý câu hỏi - {subLesson.displayId || ""} {subLesson.title}
            </span>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {/* Toolbar */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              gap: 2,
              background: theme.palette.mode === "dark"
                ? theme.palette.background.default
                : "#f8f9fa",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddQuestion}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                },
              }}
            >
              Thêm câu hỏi
            </Button>

            <Button
              variant="outlined"
              startIcon={<CloudDownload />}
              onClick={() => setImportModal(true)}
              sx={{
                borderColor: "#667eea",
                color: "#667eea",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#764ba2",
                  background: "rgba(102, 126, 234, 0.08)",
                },
              }}
            >
              Import từ ngân hàng
            </Button>

            <Box sx={{ flex: 1 }} />

            <Chip
              label={`${questions.length} câu hỏi`}
              sx={{
                background: "rgba(102, 126, 234, 0.1)",
                color: "#667eea",
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Questions Table */}
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 200,
              }}
            >
              <CircularProgress />
            </Box>
          ) : questions.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 200,
                color: "text.secondary",
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                Chưa có câu hỏi nào
              </Typography>
              <Typography variant="body2">
                Nhấn "Thêm câu hỏi" hoặc "Import từ ngân hàng" để bắt đầu
              </Typography>
            </Box>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleQuestionDragEnd}
            >
              <TableContainer sx={{ maxHeight: "calc(60vh - 200px)" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40, fontWeight: 700 }}>
                        #
                      </TableCell>
                      <TableCell sx={{ width: 60, fontWeight: 700 }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Nội dung câu hỏi
                      </TableCell>
                      <TableCell sx={{ width: 100, fontWeight: 700 }}>
                        Category
                      </TableCell>
                      <TableCell sx={{ width: 100, fontWeight: 700 }}>
                        Testcases
                      </TableCell>
                      <TableCell sx={{ width: 120, fontWeight: 700 }}>
                        Thao tác
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <SortableContext
                    items={questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <TableBody>
                      {questions.map((question, index) => (
                        <SortableQuestionRow
                          key={question.id}
                          question={question}
                          index={index}
                          onEdit={handleEditQuestion}
                          onDelete={handleDeleteClick}
                        />
                      ))}
                    </TableBody>
                  </SortableContext>
                </Table>
              </TableContainer>
            </DndContext>
          )}
        </DialogContent>

        <DialogActions sx={{
          p: 2,
          background: theme.palette.mode === "dark"
            ? theme.palette.background.default
            : "#f8f9fa",
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Form Dialog */}
      <QuestionFormDialog
        open={questionDialog.open}
        editing={questionDialog.editing}
        onClose={() => setQuestionDialog({ open: false, editing: null })}
        onSave={handleSaveQuestion}
      />

      {/* Import From Bank Modal */}
      <ImportFromBankModal
        open={importModal}
        onClose={() => setImportModal(false)}
        targetLessonId={subLesson?.lessonId}
        courseId={courseId}
        onSuccess={handleImportSuccess}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={`Câu hỏi ID: ${deleteTarget?.id}`}
        itemType="câu hỏi"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ==================== SORTABLE QUESTION ROW COMPONENT ====================

function SortableQuestionRow({ question, index, onEdit, onDelete }) {
  const theme = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? "rgba(102, 126, 234, 0.08)" : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      hover
      sx={{
        "&:hover": {
          backgroundColor: "rgba(102, 126, 234, 0.04)",
        },
      }}
    >
      <TableCell>
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: "flex",
            alignItems: "center",
            color: theme.palette.text.disabled,
            cursor: isDragging ? "grabbing" : "grab",
            "&:hover": { color: "#667eea" },
          }}
        >
          <DragIndicator fontSize="small" sx={{ mr: 0.5 }} />
          {index + 1}
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={question.id}
          size="small"
          sx={{
            background: "rgba(102, 126, 234, 0.1)",
            fontWeight: 600,
          }}
        />
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            maxWidth: 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={stripHtml(question.question)}
        >
          {truncate(question.question, 100)}
        </Typography>
      </TableCell>
      <TableCell>
        {question.category && (
          <Chip
            label={question.category}
            size="small"
            sx={{
              background: "rgba(17, 153, 142, 0.1)",
              color: "#11998e",
              fontSize: "0.75rem",
            }}
          />
        )}
      </TableCell>
      <TableCell>
        <Chip
          label={question.testcase?.length || 0}
          size="small"
          sx={{
            background: "rgba(250, 112, 154, 0.1)",
            color: "#fa709a",
          }}
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Chỉnh sửa">
            <IconButton
              size="small"
              onClick={() => onEdit(question)}
              sx={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton
              size="small"
              onClick={() => onDelete(question)}
              sx={{
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}
