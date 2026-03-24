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
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { toast } from "sonner";

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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Context và Components
import { EditModeProvider, useEditMode } from "../context/EditModeContext";
import EditModeToggle from "../components/EditModeToggle";
import SubmissionHistoryModal from "../components/SubmissionHistoryModal";
import LoadingSpinner from "../components/LoadingSpinner";

// Sortable components (tách riêng để tối ưu React.memo)
import SortableLessonItem from "../components/lessons/SortableLessonItem";

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
  const [questionManager, setQuestionManager] = useState({
    open: false,
    subLesson: null,
  });
  const [deleteTarget, setDeleteTarget] = useState({
    open: false,
    type: null,
    item: null,
  });

  const [subLessonDialog, setSubLessonDialog] = useState({
    open: false,
    editing: null,
    parentLessonId: null,
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
    if (severity === "error") toast.error(message);
    else if (severity === "warning") toast.warning(message);
    else toast.success(message);
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
    fetch(`${process.env.REACT_APP_API_URL}/api/lessons/course/${classId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
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
    // Toggle: nếu đã mở thì đóng lại (AnimatePresence trong SortableLessonItem xử lý exit)
    if (expanded === lessonId) {
      setExpanded(null);
      return;
    }

    setExpanded(lessonId);

    if (!subLessons[lessonId]) {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/lessons/detail/${lessonId}?courseId=${classId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
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

      // Dùng functional update để tránh capture stale subLessons
      setSubLessons((prev) => {
        const currentSubLessons = prev[parentLessonId] || [];
        const oldIndex = currentSubLessons.findIndex(
          (s) => s.lessonId === active.id,
        );
        const newIndex = currentSubLessons.findIndex(
          (s) => s.lessonId === over.id,
        );
        if (oldIndex === -1 || newIndex === -1) return prev;
        const newSubLessons = arrayMove(currentSubLessons, oldIndex, newIndex);

        // Lưu thứ tự mới lên server (async, không block state update)
        const subLessonIds = newSubLessons.map((s) => s.lessonId);
        api.reorderSubLessons(parentLessonId, subLessonIds, classId)
          .then(() => showMessage("Cập nhật thứ tự bài học con thành công!"))
          .catch(async (err) => {
            console.error("❌ Lỗi cập nhật thứ tự:", err);
            showMessage("Lỗi khi cập nhật thứ tự", "error");
            // Rollback từ server
            try {
              const res = await api.getLessonDetail(parentLessonId, classId);
              if (res.data.subLessons) {
                const sorted = [...res.data.subLessons].sort(
                  (a, b) => (a.order ?? 0) - (b.order ?? 0),
                );
                setSubLessons((p) => ({ ...p, [parentLessonId]: sorted }));
              }
            } catch (_) {}
          });

        return { ...prev, [parentLessonId]: newSubLessons };
      });
    },
    [api, classId, showMessage],
  );

  // ==================== RENDER ====================

  if (loading) return <LoadingSpinner label="Đang tải bài học..." />;

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
        <p style={{ fontSize: "0.9rem", color: "#767676" }}>
          Vui lòng liên hệ giáo viên để được thêm vào khóa học.
        </p>
        <button
          type="button"
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
              isExpanded={expanded === lesson.lessonId}
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
    </div>
  );
}


