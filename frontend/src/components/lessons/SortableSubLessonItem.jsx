// src/components/lessons/SortableSubLessonItem.jsx
// Component hiển thị một sub-lesson với drag & drop support

import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import {
  Edit,
  Delete,
  QuestionAnswer,
  DragIndicator,
} from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableSubLessonItem = React.memo(function SortableSubLessonItem({
  sub,
  index,
  editMode,
  parentLessonId,
  classId,
  subProgress,
  onEditSubLesson,
  onDeleteSubLesson,
  onOpenQuestionManager,
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
    id: sub.lessonId,
    disabled: !editMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    animationDelay: `${0.1 * (index + 1)}s`,
    ...(editMode && sub.display === false
      ? {
          border: "2px dashed #9e9e9e",
          borderRadius: "8px",
        }
      : {}),
  };

  const prog = subProgress[sub.lessonId] || {
    progress: 0,
    completed: false,
  };

  return (
    <div ref={setNodeRef} style={style} className="sub-lesson-wrapper">
      <div className="sub-lesson">
        {/* Drag handle */}
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
            <DragIndicator fontSize="small" />
          </Box>
        )}

        <div
          className="sub-lesson__info"
          style={{
            flex: 1,
            opacity: sub.display === false && editMode ? 0.7 : 1,
          }}
        >
          <h4>
            {sub.displayId ? `${sub.displayId}: ` : ""}
            {sub.title}
            {editMode && sub.display === false && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "0.7rem",
                  color: "#9e9e9e",
                  fontWeight: "normal",
                }}
              >
                (Ẩn)
              </span>
            )}
          </h4>
          <p>{sub.description}</p>
          <p>Số câu hỏi: {sub.questionCount ?? 0}</p>
        </div>

        <div className="sub-lesson__actions">
          {/* Edit Mode actions */}
          {editMode && (
            <Box sx={{ display: "flex", gap: 0.5, mr: 1 }}>
              <Tooltip title="Quản lý câu hỏi">
                <IconButton
                  size="small"
                  onClick={() => onOpenQuestionManager(sub, parentLessonId)}
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
                  <QuestionAnswer fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <IconButton
                  size="small"
                  onClick={() => onEditSubLesson(sub, parentLessonId)}
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
                  onClick={() => onDeleteSubLesson(sub, parentLessonId)}
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

          {/* Student actions */}
          <button
            className="btn-do"
            onClick={() =>
              navigate(
                sub.mode === "simple"
                  ? `/course/${classId}/lesson-simple/${sub.lessonId}`
                  : sub.mode === "middle"
                    ? `/course/${classId}/lesson-middle/${sub.lessonId}`
                    : `/course/${classId}/lesson/${sub.lessonId}`
              )
            }
          >
            {prog.progress > 0 ? "Làm lại" : "Làm bài"}
          </button>

          {prog.progress > 0 && (
            <button
              className="btn-history"
              onClick={() => setHistoryTarget(sub.lessonId)}
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

      {/* Progress bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div
            className={`progress-fill ${
              prog.progress >= 90 ? "excellent" : ""
            }`}
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
});

export default SortableSubLessonItem;
