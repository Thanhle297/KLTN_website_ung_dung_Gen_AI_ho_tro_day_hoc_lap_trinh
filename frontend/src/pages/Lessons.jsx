// src/pages/Lessons.jsx
// Trang hiển thị danh sách bài học của một khóa học
// Hỗ trợ Edit Mode cho Teacher/Admin: CRUD lessons/sublessons và Drag & Drop

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../styles/Lessons.scss";

// MUI Components
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Edit, Delete, DragIndicator, Quiz } from "@mui/icons-material";

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

// Context và Components
import { EditModeProvider, useEditMode } from "../context/EditModeContext";
import EditModeToggle from "../components/EditModeToggle";
import SubmissionHistoryModal from "../components/SubmissionHistoryModal";

// Dialogs
import LessonFormDialog from "../components/admin/lessons/LessonFormDialog";
import SubLessonFormDialog from "../components/admin/sublessons/SubLessonFormDialog";
import DeleteConfirmDialog from "../components/admin/shared/DeleteConfirmDialog";
import QuestionManagerDialog from "../components/admin/questions/QuestionManagerDialog";

// API Hook
import useAdminAPI from "../hook/useAdminAPI";

// ==================== MAIN COMPONENT ====================

export default function Lessons() {
  const { classId } = useParams();

  return (
    <EditModeProvider courseId={classId}>
      <LessonsContent />
    </EditModeProvider>
  );
}

// ==================== LESSONS CONTENT ====================

function LessonsContent() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const api = useAdminAPI();
  const { editMode } = useEditMode();

  // State cơ bản
  const [lessons, setLessons] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [closing, setClosing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subLessons, setSubLessons] = useState({});
  const [subProgress, setSubProgress] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);

  // State cho dialogs
  const [lessonDialog, setLessonDialog] = useState({
    open: false,
    editing: null,
  });
  const [subLessonDialog, setSubLessonDialog] = useState({
    open: false,
    editing: null,
    parentLessonId: null,
  });
  const [questionManager, setQuestionManager] = useState({
    open: false,
    subLesson: null,
  });
  const [deleteTarget, setDeleteTarget] = useState({
    open: false,
    type: null,
    item: null,
  });

  // State cho snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const token = localStorage.getItem("token");

  const userId = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode(token).id;
    } catch {
      return null;
    }
  }, [token]);

  // Helper để hiển thị thông báo
  const showMessage = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // ==================== FETCH DATA ====================

  useEffect(() => {
    const checkAccess = async () => {
      // Reset state khi đổi khóa học
      setLoading(true);
      setLessons([]);
      setSubLessons({});
      setSubProgress({});
      setExpanded(null);
      setClosing(null);

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/courses/my-courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const myCourses = await res.json();
        const hasAccess = myCourses.some(
          (course) => String(course.courseId) === String(classId),
        );

        if (!hasAccess) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        setAccessDenied(false);

        fetchLessons();
      } catch (err) {
        console.error("❌ Lỗi kiểm tra quyền:", err);
        setAccessDenied(true);
        setLoading(false);
      }
    };

    checkAccess();
  }, [classId, token]);

  const fetchLessons = useCallback(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/lessons/course/${classId}`)
      .then((res) => res.json())
      .then((data) => {
        // Sắp xếp theo order
        const sorted = [...data].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        setLessons(sorted);
      })
      .catch((err) => console.error("❌ Lỗi tải bài học:", err))
      .finally(() => setLoading(false));
  }, [classId]);

  const fetchSublessonProgress = async (subLessonId) => {
    if (!userId) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/progress/sublesson/${userId}/${subLessonId}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setSubProgress((prev) => ({
        ...prev,
        [subLessonId]: {
          progress: data.progress ?? 0,
          completed: !!data.completed,
        },
      }));
    } catch (err) {
      console.error("❌ Lỗi tải tiến độ subLesson:", err);
    }
  };

  const handleExpand = async (lessonId) => {
    if (expanded === lessonId) {
      setClosing(lessonId);
      setExpanded(null);
      setTimeout(() => setClosing(null), 600);
      return;
    }

    setExpanded(lessonId);
    setClosing(null);

    if (!subLessons[lessonId]) {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/lessons/detail/${lessonId}?courseId=${classId}`,
        );
        const data = await res.json();
        if (data.subLessons) {
          // Sắp xếp theo order
          const sorted = [...data.subLessons].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
          );
          setSubLessons((prev) => ({ ...prev, [lessonId]: sorted }));
          sorted.forEach((sub) => fetchSublessonProgress(sub.lessonId));
        }
      } catch (err) {
        console.error("❌ Lỗi tải bài con:", err);
      }
    } else {
      subLessons[lessonId].forEach((sub) =>
        fetchSublessonProgress(sub.lessonId),
      );
    }
  };

  // ==================== LESSON CRUD ====================

  const handleAddLesson = useCallback(() => {
    setLessonDialog({ open: true, editing: null });
  }, []);

  const handleEditLesson = useCallback((lesson) => {
    setLessonDialog({ open: true, editing: lesson });
  }, []);

  const handleDeleteLessonClick = useCallback((lesson) => {
    setDeleteTarget({ open: true, type: "lesson", item: lesson });
  }, []);

  const handleSaveLesson = useCallback(
    async (formData) => {
      try {
        if (lessonDialog.editing) {
          await api.updateLesson(
            lessonDialog.editing.lessonId,
            formData,
            classId,
          );
          showMessage("Cập nhật bài học thành công!");
        } else {
          await api.createLesson({ ...formData, courseId: classId });
          showMessage("Thêm bài học thành công!");
        }
        setLessonDialog({ open: false, editing: null });
        fetchLessons();
      } catch (err) {
        console.error("❌ Lỗi lưu bài học:", err);
        showMessage(
          "Lỗi khi lưu bài học: " +
            (err.response?.data?.message || err.message),
          "error",
        );
      }
    },
    [lessonDialog.editing, api, classId, fetchLessons, showMessage],
  );

  // ==================== SUBLESSON CRUD ====================

  const handleAddSubLesson = useCallback((parentLessonId) => {
    setSubLessonDialog({ open: true, editing: null, parentLessonId });
  }, []);

  const handleEditSubLesson = useCallback((subLesson, parentLessonId) => {
    setSubLessonDialog({ open: true, editing: subLesson, parentLessonId });
  }, []);

  const handleDeleteSubLessonClick = useCallback(
    (subLesson, parentLessonId) => {
      setDeleteTarget({
        open: true,
        type: "sublesson",
        item: { ...subLesson, parentLessonId },
      });
    },
    [],
  );

  const handleSaveSubLesson = useCallback(
    async (formData) => {
      const { parentLessonId } = subLessonDialog;
      try {
        if (subLessonDialog.editing) {
          await api.updateSubLesson(
            parentLessonId,
            subLessonDialog.editing.lessonId,
            formData,
            classId,
          );
          showMessage("Cập nhật bài học con thành công!");
        } else {
          await api.createSubLesson(parentLessonId, formData, classId);
          showMessage("Thêm bài học con thành công!");
        }
        setSubLessonDialog({
          open: false,
          editing: null,
          parentLessonId: null,
        });

        // Refresh subLessons cho lesson này
        const res = await api.getLessonDetail(parentLessonId, classId);
        if (res.data.subLessons) {
          const sorted = [...res.data.subLessons].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
          );
          setSubLessons((prev) => ({ ...prev, [parentLessonId]: sorted }));
        }
      } catch (err) {
        console.error("❌ Lỗi lưu bài học con:", err);
        showMessage(
          "Lỗi khi lưu bài học con: " +
            (err.response?.data?.message || err.message),
          "error",
        );
      }
    },
    [subLessonDialog, api, classId, showMessage],
  );

  // ==================== DELETE HANDLER ====================

  const handleDeleteConfirm = useCallback(async () => {
    const { type, item } = deleteTarget;
    try {
      if (type === "lesson") {
        await api.deleteLesson(item.lessonId, classId);
        showMessage("Xóa bài học thành công!");
        fetchLessons();
      } else if (type === "sublesson") {
        await api.deleteSubLesson(item.parentLessonId, item.lessonId, classId);
        showMessage("Xóa bài học con thành công!");

        // Refresh subLessons
        const res = await api.getLessonDetail(item.parentLessonId, classId);
        if (res.data.subLessons) {
          const sorted = [...res.data.subLessons].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
          );
          setSubLessons((prev) => ({ ...prev, [item.parentLessonId]: sorted }));
        }
      }
      setDeleteTarget({ open: false, type: null, item: null });
    } catch (err) {
      console.error("❌ Lỗi xóa:", err);
      showMessage(
        "Lỗi khi xóa: " + (err.response?.data?.message || err.message),
        "error",
      );
    }
  }, [deleteTarget, api, classId, fetchLessons, showMessage]);

  // ==================== QUESTION MANAGER ====================

  const handleOpenQuestionManager = useCallback((subLesson) => {
    setQuestionManager({ open: true, subLesson });
  }, []);

  const handleQuestionsChanged = useCallback(() => {
    // Refresh question count cho subLesson hiện tại
    if (questionManager.subLesson) {
      const parentLessonId = findParentLessonId(
        questionManager.subLesson.lessonId,
      );
      if (parentLessonId) {
        api.getLessonDetail(parentLessonId, classId).then((res) => {
          if (res.data.subLessons) {
            const sorted = [...res.data.subLessons].sort(
              (a, b) => (a.order ?? 0) - (b.order ?? 0),
            );
            setSubLessons((prev) => ({ ...prev, [parentLessonId]: sorted }));
          }
        });
      }
    }
  }, [questionManager.subLesson, api, classId]);

  // Helper để tìm parent lesson
  const findParentLessonId = useCallback(
    (subLessonId) => {
      for (const [lessonId, subs] of Object.entries(subLessons)) {
        if (subs.some((s) => s.lessonId === subLessonId)) {
          return lessonId;
        }
      }
      return null;
    },
    [subLessons],
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
    }),
  );

  const handleLessonDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = lessons.findIndex((l) => l.lessonId === active.id);
      const newIndex = lessons.findIndex((l) => l.lessonId === over.id);

      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newLessons);

      // Lưu thứ tự mới lên server
      try {
        const lessonIds = newLessons.map((l) => l.lessonId);
        await api.reorderLessons(classId, lessonIds);
        showMessage("Cập nhật thứ tự bài học thành công!");
      } catch (err) {
        console.error("❌ Lỗi cập nhật thứ tự:", err);
        showMessage("Lỗi khi cập nhật thứ tự", "error");
        // Rollback
        fetchLessons();
      }
    },
    [lessons, api, classId, fetchLessons, showMessage],
  );

  const handleSubLessonDragEnd = useCallback(
    async (event, parentLessonId) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentSubLessons = subLessons[parentLessonId] || [];
      const oldIndex = currentSubLessons.findIndex(
        (s) => s.lessonId === active.id,
      );
      const newIndex = currentSubLessons.findIndex(
        (s) => s.lessonId === over.id,
      );

      const newSubLessons = arrayMove(currentSubLessons, oldIndex, newIndex);
      setSubLessons((prev) => ({ ...prev, [parentLessonId]: newSubLessons }));

      // Lưu thứ tự mới lên server
      try {
        const subLessonIds = newSubLessons.map((s) => s.lessonId);
        await api.reorderSubLessons(parentLessonId, subLessonIds, classId);
        showMessage("Cập nhật thứ tự bài học con thành công!");
      } catch (err) {
        console.error("❌ Lỗi cập nhật thứ tự:", err);
        showMessage("Lỗi khi cập nhật thứ tự", "error");
        // Rollback
        const res = await api.getLessonDetail(parentLessonId, classId);
        if (res.data.subLessons) {
          const sorted = [...res.data.subLessons].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
          );
          setSubLessons((prev) => ({ ...prev, [parentLessonId]: sorted }));
        }
      }
    },
    [subLessons, api, classId, showMessage],
  );

  // ==================== RENDER ====================

  if (loading) return <p>Đang tải danh sách bài học...</p>;

  if (accessDenied) {
    return (
      <div
        className="lessons-list"
        style={{ textAlign: "center", padding: "3rem" }}
      >
        <h1 style={{ color: "#e53e3e", marginBottom: "1rem" }}>
          🚫 Không có quyền truy cập
        </h1>
        <p
          style={{ fontSize: "1.1rem", color: "#666", marginBottom: "1.5rem" }}
        >
          Bạn chưa được phân bổ vào khóa học này.
        </p>
        <p style={{ fontSize: "0.9rem", color: "#999" }}>
          Vui lòng liên hệ giáo viên để được thêm vào khóa học.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "2rem",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  // Lọc lessons: ẩn nếu display=false và không ở editMode
  const visibleLessons = editMode
    ? lessons
    : lessons.filter((lesson) => lesson.display !== false);

  return (
    <div className="lessons-list">
      {/* Header với EditModeToggle */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <h1 className="lessons-list__title">
          Danh sách bài học - Lớp {classId}
        </h1>
        <EditModeToggle />
      </Box>

      {/* Nút thêm bài học (khi editMode ON) */}
      {editMode && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddLesson}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
              },
            }}
          >
            Thêm bài học
          </Button>
        </Box>
      )}

      {/* Danh sách lessons */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleLessonDragEnd}
      >
        <SortableContext
          items={visibleLessons.map((l) => l.lessonId)}
          strategy={verticalListSortingStrategy}
        >
          {visibleLessons.map((lesson) => (
            <SortableLessonItem
              key={lesson.lessonId}
              lesson={lesson}
              expanded={expanded}
              closing={closing}
              subLessons={subLessons[lesson.lessonId] || []}
              subProgress={subProgress}
              editMode={editMode}
              classId={classId}
              sensors={sensors}
              onExpand={handleExpand}
              onEditLesson={handleEditLesson}
              onDeleteLesson={handleDeleteLessonClick}
              onAddSubLesson={handleAddSubLesson}
              onEditSubLesson={handleEditSubLesson}
              onDeleteSubLesson={handleDeleteSubLessonClick}
              onOpenQuestionManager={handleOpenQuestionManager}
              onSubLessonDragEnd={handleSubLessonDragEnd}
              onNavigate={navigate}
              onViewHistory={setHistoryTarget}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* ==================== DIALOGS ==================== */}

      {/* Lesson Form Dialog */}
      <LessonFormDialog
        open={lessonDialog.open}
        editing={lessonDialog.editing}
        courses={[{ courseId: classId, title: `Khóa học ${classId}` }]}
        defaultCourseId={classId}
        onClose={() => setLessonDialog({ open: false, editing: null })}
        onSave={handleSaveLesson}
      />

      {/* SubLesson Form Dialog */}
      <SubLessonFormDialog
        open={subLessonDialog.open}
        editing={subLessonDialog.editing}
        onClose={() =>
          setSubLessonDialog({
            open: false,
            editing: null,
            parentLessonId: null,
          })
        }
        onSave={handleSaveSubLesson}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteTarget.open}
        itemName={
          deleteTarget.type === "lesson"
            ? deleteTarget.item?.title
            : deleteTarget.item?.title
        }
        itemType={deleteTarget.type === "lesson" ? "bài học" : "bài học con"}
        onConfirm={handleDeleteConfirm}
        onCancel={() =>
          setDeleteTarget({ open: false, type: null, item: null })
        }
      />

      {/* Question Manager Dialog */}
      <QuestionManagerDialog
        open={questionManager.open}
        subLesson={questionManager.subLesson}
        courseId={classId}
        onClose={() => setQuestionManager({ open: false, subLesson: null })}
        onQuestionsChanged={handleQuestionsChanged}
      />

      {/* Submission History Modal */}
      {historyTarget && (
        <SubmissionHistoryModal
          userId={userId}
          subLessonId={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

// ==================== SORTABLE LESSON ITEM ====================

function SortableLessonItem({
  lesson,
  expanded,
  closing,
  subLessons,
  subProgress,
  editMode,
  classId,
  sensors,
  onExpand,
  onEditLesson,
  onDeleteLesson,
  onAddSubLesson,
  onEditSubLesson,
  onDeleteSubLesson,
  onOpenQuestionManager,
  onSubLessonDragEnd,
  onNavigate,
  onViewHistory,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.lessonId, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isExpanded = expanded === lesson.lessonId;
  const isClosing = closing === lesson.lessonId;
  const isHidden = lesson.display === false;

  // Lọc subLessons: ẩn nếu display=false và không ở editMode
  const visibleSubLessons = editMode
    ? subLessons
    : subLessons.filter((sub) => sub.display !== false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`lesson-item ${isExpanded ? "expanded" : isClosing ? "closing" : ""} ${isHidden && editMode ? "hidden-lesson" : ""}`}
    >
      <div className="lesson-item__top">
        {/* Drag handle (khi editMode) */}
        {editMode && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: "flex",
              alignItems: "center",
              color: "#9e9e9e",
              cursor: isDragging ? "grabbing" : "grab",
              mr: 1,
              "&:hover": { color: "#667eea" },
            }}
          >
            <DragIndicator />
          </Box>
        )}

        <div
          className="lesson-item__info"
          onClick={() => onExpand(lesson.lessonId)}
        >
          <h3>
            {lesson.title}
            {isHidden && editMode && (
              <span
                style={{ color: "#999", fontSize: "0.8rem", marginLeft: 8 }}
              >
                (Ẩn)
              </span>
            )}
          </h3>
          <p>{lesson.description}</p>
        </div>

        {/* Edit/Delete buttons (khi editMode) */}
        {editMode && (
          <Box sx={{ display: "flex", gap: 0.5, mr: 1 }}>
            <Tooltip title="Chỉnh sửa bài học">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditLesson(lesson);
                }}
                sx={{
                  background:
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
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
            <Tooltip title="Xóa bài học">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLesson(lesson);
                }}
                sx={{
                  background:
                    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
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
        )}

        <button
          className="lesson-item__btn"
          onClick={() => onExpand(lesson.lessonId)}
        >
          {isExpanded ? "Thu gọn" : "Xem chi tiết"}
        </button>
      </div>

      {/* SubLessons */}
      {(isExpanded || isClosing) && visibleSubLessons.length > 0 && (
        <div className={`sub-lessons ${isExpanded ? "opening" : "closing"}`}>
          {/* Nút thêm bài học con (khi editMode) */}
          {editMode && isExpanded && (
            <Box sx={{ mb: 2, pl: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => onAddSubLesson(lesson.lessonId)}
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
                Thêm bài học con
              </Button>
            </Box>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onSubLessonDragEnd(event, lesson.lessonId)}
          >
            <SortableContext
              items={visibleSubLessons.map((s) => s.lessonId)}
              strategy={verticalListSortingStrategy}
            >
              {visibleSubLessons.map((sub, index) => (
                <SortableSubLessonItem
                  key={sub.lessonId}
                  sub={sub}
                  index={index}
                  prog={
                    subProgress[sub.lessonId] || {
                      progress: 0,
                      completed: false,
                    }
                  }
                  editMode={editMode}
                  classId={classId}
                  parentLessonId={lesson.lessonId}
                  onEdit={onEditSubLesson}
                  onDelete={onDeleteSubLesson}
                  onOpenQuestionManager={onOpenQuestionManager}
                  onNavigate={onNavigate}
                  onViewHistory={onViewHistory}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Nút thêm bài học con khi chưa có (và đang expanded + editMode) */}
      {isExpanded && editMode && visibleSubLessons.length === 0 && (
        <div className="sub-lessons opening">
          <Box sx={{ p: 2, textAlign: "center" }}>
            <p style={{ color: "#666", marginBottom: "1rem" }}>
              Chưa có bài học con nào
            </p>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => onAddSubLesson(lesson.lessonId)}
              sx={{
                borderColor: "#667eea",
                color: "#667eea",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Thêm bài học con
            </Button>
          </Box>
        </div>
      )}
    </div>
  );
}

// ==================== SORTABLE SUBLESSON ITEM ====================

function SortableSubLessonItem({
  sub,
  index,
  prog,
  editMode,
  classId,
  parentLessonId,
  onEdit,
  onDelete,
  onOpenQuestionManager,
  onNavigate,
  onViewHistory,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sub.lessonId, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    animationDelay: `${0.1 * (index + 1)}s`,
  };

  const isHidden = sub.display === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sub-lesson-wrapper ${isHidden && editMode ? "hidden-sublesson" : ""}`}
    >
      <div className="sub-lesson">
        {/* Drag handle (khi editMode) */}
        {editMode && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: "flex",
              alignItems: "center",
              color: "#9e9e9e",
              cursor: isDragging ? "grabbing" : "grab",
              mr: 1,
              "&:hover": { color: "#667eea" },
            }}
          >
            <DragIndicator fontSize="small" />
          </Box>
        )}

        <div className="sub-lesson__info">
          <h4>
            {sub.displayId ? `${sub.displayId}: ` : ""}
            {sub.title}
            {isHidden && editMode && (
              <span
                style={{ color: "#999", fontSize: "0.75rem", marginLeft: 8 }}
              >
                (Ẩn)
              </span>
            )}
          </h4>
          <p>{sub.description}</p>
          <p>Số câu hỏi: {sub.questionCount ?? 0}</p>
        </div>

        <div className="sub-lesson__actions">
          {/* Edit Mode Actions */}
          {editMode && (
            <Box sx={{ display: "flex", gap: 0.5, mr: 1 }}>
              <Tooltip title="Quản lý câu hỏi">
                <IconButton
                  size="small"
                  onClick={() => onOpenQuestionManager(sub)}
                  sx={{
                    background:
                      "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                    color: "white",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #38ef7d 0%, #11998e 100%)",
                    },
                  }}
                >
                  <Quiz fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <IconButton
                  size="small"
                  onClick={() => onEdit(sub, parentLessonId)}
                  sx={{
                    background:
                      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
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
                  onClick={() => onDelete(sub, parentLessonId)}
                  sx={{
                    background:
                      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
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
          )}

          <button
            className="btn-do"
            onClick={() =>
              onNavigate(
                sub.mode === "simple"
                  ? `/course/${classId}/lesson-simple/${sub.lessonId}`
                  : `/course/${classId}/lesson/${sub.lessonId}`,
              )
            }
          >
            {prog.progress > 0 ? "Làm lại" : "Làm bài"}
          </button>

          {/* Nút xem lịch sử - Chỉ hiển thị khi đã làm bài */}
          {prog.progress > 0 && (
            <button
              className="btn-history"
              onClick={() => onViewHistory(sub.lessonId)}
              style={{
                marginLeft: "0.5rem",
                padding: "0.5rem 1rem",
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Lịch sử
            </button>
          )}

          <button
            className={`btn-status ${prog.completed ? "done" : "pending"}`}
            disabled
          >
            {prog.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
          </button>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div
            className={`progress-fill ${prog.progress >= 90 ? "excellent" : ""}`}
            style={{ width: `${prog.progress}%` }}
          />
        </div>
        <div className="progress-label">
          <div className="rating">
            {prog.progress < 50 && <span className="face">😞</span>}
            {prog.progress >= 50 && prog.progress < 70 && <span>⭐</span>}
            {prog.progress >= 70 && prog.progress < 90 && (
              <>
                <span>⭐</span>
                <span>⭐</span>
              </>
            )}
            {prog.progress >= 90 && (
              <>
                <span>⭐</span>
                <span>⭐</span>
                <span>⭐</span>
              </>
            )}
          </div>
          <span className="percent">{prog.progress}%</span>
        </div>
      </div>
    </div>
  );
}
