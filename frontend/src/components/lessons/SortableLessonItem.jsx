// src/components/lessons/SortableLessonItem.jsx
// Component hiển thị một lesson với drag & drop support

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

import SortableSubLessonItem from "./SortableSubLessonItem";

const SortableLessonItem = React.memo(function SortableLessonItem({
  lesson,
  editMode,
  expanded,
  closing,
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
  navigate,
  setHistoryTarget,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const isExpanded = expanded === lesson.lessonId;
  const isClosing = closing === lesson.lessonId;
  const subList = subLessons[lesson.lessonId] || [];

  // Lọc subLessons hiển thị
  const visibleSubLessons = editMode
    ? subList
    : subList.filter((sub) => sub.display !== false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`lesson-item ${
        isExpanded ? "expanded" : isClosing ? "closing" : ""
      } ${editMode ? "edit-mode" : ""}`}
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
          style={{
            flex: 1,
            opacity: lesson.display === false && editMode ? 0.7 : 1,
          }}
        >
          <h3>
            {lesson.title}
            {editMode && lesson.display === false && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "0.75rem",
                  color: "#9e9e9e",
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
          <Box sx={{ display: "flex", gap: 0.5, mr: 2 }}>
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

      {/* SUB-LESSONS với Drag & Drop */}
      {(isExpanded || isClosing) && (
        <div className={`sub-lessons ${isExpanded ? "opening" : "closing"}`}>
          {/* Nút thêm bài học con */}
          {editMode && isExpanded && (
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

          {/* SubLessons với Drag & Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onSubLessonDragEnd(event, lesson.lessonId)}
          >
            <SortableContext
              items={visibleSubLessons.map((s) => s.lessonId)}
              strategy={verticalListSortingStrategy}
              disabled={!editMode}
            >
              {visibleSubLessons.map((sub, index) => (
                <SortableSubLessonItem
                  key={sub.lessonId}
                  sub={sub}
                  index={index}
                  editMode={editMode}
                  parentLessonId={lesson.lessonId}
                  classId={classId}
                  subProgress={subProgress}
                  onEditSubLesson={onEditSubLesson}
                  onDeleteSubLesson={onDeleteSubLesson}
                  onOpenQuestionManager={onOpenQuestionManager}
                  navigate={navigate}
                  setHistoryTarget={setHistoryTarget}
                />
              ))}
            </SortableContext>
          </DndContext>

          {visibleSubLessons.length === 0 && (
            <p style={{ color: "#666", fontStyle: "italic", padding: "1rem" }}>
              Chưa có bài học con nào.
              {editMode && ' Nhấn nút "Thêm bài học con" để bắt đầu.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default SortableLessonItem;
