import React, { useState, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Layout from "../components/Layout";
import LayoutMobile from "../components/LayoutMobile";
import DifficultySlider from "../components/DifficultySlider";
import SubmitButton from "../components/SubmitButton";
import LoadingSpinner from "../components/LoadingSpinner";
import useLessonQuestions from "../hook/useLessonQuestions";
import useIsMobile from "../hook/useIsMobile";
import { HeaderContext } from "../context/HeaderContext";
import "../styles/CodeEx.scss";

export default function CodeEx() {
  const { lessonId, classId } = useParams();
  const isMobile = useIsMobile();
  const token = localStorage.getItem("token");
  const userId = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode(token).id;
    } catch {
      return null;
    }
  }, [token]);
  const [difficulty, setDifficulty] = useState(0);
  const { showHeader, setShowHeader } = useContext(HeaderContext);

  // ✅ Dùng custom hook
  const {
    lesson,
    questions,
    current,
    setCurrent,
    editorStates,
    setEditorStates,
    loading,
  } = useLessonQuestions(lessonId, userId, classId);

  // Nếu đang tải
  if (loading) return <LoadingSpinner label="Đang tải dữ liệu..." />;
  if (!current) return <p>Không có câu hỏi nào cho bài này.</p>;

  // Hàm cập nhật editor state
  const updateEditorState = (id, newState) => {
    setEditorStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...newState },
    }));
  };

  return (
    <div className="code-ex-page">
      <div className="top-bar">
        <div
          className="left"
          style={{ display: "flex", alignItems: "center", gap: "15px" }}
        >
          <button
            onClick={() => setShowHeader(!showHeader)}
            className="toggle-header-btn"
            title={showHeader ? "Ẩn Header" : "Hiện Header"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "#555",
            }}
          >
            <i
              className={`fas ${
                showHeader ? "fa-compress-arrows-alt" : "fa-expand-arrows-alt"
              }`}
            ></i>
          </button>
          <DifficultySlider onChange={setDifficulty} />
        </div>
        <div className="right">
          {lesson && (
            <SubmitButton
              userId={userId}
              lessonId={lessonId}
              courseId={lesson.courseId}
              editorStates={editorStates}
            />
          )}
        </div>
      </div>

      {isMobile ? (
        <LayoutMobile
          questions={questions}
          current={current}
          editorStates={editorStates}
          setCurrent={setCurrent}
          updateEditorState={updateEditorState}
          difficulty={difficulty}
          lessonId={lessonId}
          userId={userId}
          lessonNumber={lesson?.lessonNumber}
        />
      ) : (
        <Layout
          questions={questions}
          current={current}
          editorStates={editorStates}
          setCurrent={setCurrent}
          updateEditorState={updateEditorState}
          difficulty={difficulty}
          lessonId={lessonId}
          userId={userId}
          lessonNumber={lesson?.lessonNumber}
        />
      )}
    </div>
  );
}
