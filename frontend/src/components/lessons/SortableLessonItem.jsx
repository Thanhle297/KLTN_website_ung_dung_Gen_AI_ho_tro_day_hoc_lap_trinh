// src/components/lessons/SortableLessonItem.jsx
// Component hiển thị một lesson với drag & drop support và framer-motion animation

import React from "react";
import { Box, IconButton, Tooltip, Button } from "@mui/material";
import { Add, Edit, Delete, DragIndicator } from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";

import SortableSubLessonItem from "./SortableSubLessonItem";

// Variants cho container sub-lessons (điều khiển stagger cho các item con)
const subLessonsContainerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      // Stagger: mỗi item trễ hơn item trước 0.07s
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1, // Exit từ dưới lên
      when: "afterChildren",
    },
  },
};

const SortableLessonItem = React.memo(function SortableLessonItem({
  lesson,
  editMode,
  isExpanded,
  subLessons,
  subProgress,
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
  } = useSortable({
    id: lesson.lessonId,
    disabled: !editMode,
  });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 999 : undefined,
    position: "relative",
  };

  const isHidden = lesson.display === false;

  // Lọc subLessons hiển thị
  const visibleSubLessons = editMode
    ? subLessons
    : subLessons.filter((sub) => sub.display !== false);

  return (
    <div
      ref={setNodeRef}
      style={dndStyle}
      className={`lesson-item ${isExpanded ? "expanded" : ""} ${isHidden && editMode ? "hidden-lesson" : ""} ${editMode ? "edit-mode" : ""}`}
    >
      <div className="lesson-item__top">
        {/* Drag handle - hiện khi Edit Mode */}
        {editMode && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: isDragging ? "grabbing" : "grab",
              color: "#9e9e9e",
              mr: 1,
              display: "flex",
              alignItems: "center",
              "&:hover": { color: "#667eea" },
            }}
          >
            <DragIndicator />
          </Box>
        )}

        <div
          className="lesson-item__info"
          onClick={() => onExpand(lesson.lessonId)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onExpand(lesson.lessonId);
            }
          }}
          style={{
            flex: 1,
            opacity: isHidden && editMode ? 0.7 : 1,
          }}
        >
          <h3>
            {lesson.title}
            {isHidden && editMode && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "0.75rem",
                  color: "#767676",
                  fontWeight: "normal",
                }}
              >
                (Ẩn)
              </span>
            )}
          </h3>
          <p>{lesson.description}</p>
        </div>

        {/* Edit/Delete buttons - hiện khi Edit Mode */}
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
          type="button"
          className="lesson-item__btn"
          onClick={() => onExpand(lesson.lessonId)}
        >
          {isExpanded ? "Thu gọn" : "Xem chi tiết"}
        </button>
      </div>

      {/* ==================== SUB-LESSONS (framer-motion) ==================== */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="sub-lessons"
            className="sub-lessons"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
            }}
            style={{ overflow: "hidden" }}
          >
            {/* Nút thêm bài học con - khi editMode */}
            {editMode && (
              <Box sx={{ mb: 2, mt: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
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

            {visibleSubLessons.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{ color: "#666", fontStyle: "italic", padding: "1rem 0" }}
              >
                Chưa có bài học con nào.
                {editMode && ' Nhấn nút "Thêm bài học con" để bắt đầu.'}
              </motion.p>
            ) : (
              /* Container với stagger animation */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) =>
                  onSubLessonDragEnd(event, lesson.lessonId)
                }
              >
                <SortableContext
                  items={visibleSubLessons.map((s) => s.lessonId)}
                  strategy={verticalListSortingStrategy}
                >
                  <motion.div
                    variants={subLessonsContainerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {visibleSubLessons.map((sub, index) => {
                      const prog = subProgress[sub.lessonId] || {
                        progress: 0,
                        completed: false,
                      };
                      return (
                        <SortableSubLessonItem
                          key={sub.lessonId}
                          sub={sub}
                          index={index}
                          prog={prog}
                          editMode={editMode}
                          parentLessonId={lesson.lessonId}
                          classId={classId}
                          onEdit={onEditSubLesson}
                          onDelete={onDeleteSubLesson}
                          onOpenQuestionManager={onOpenQuestionManager}
                          onNavigate={onNavigate}
                          onViewHistory={onViewHistory}
                        />
                      );
                    })}
                  </motion.div>
                </SortableContext>
              </DndContext>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SortableLessonItem;
