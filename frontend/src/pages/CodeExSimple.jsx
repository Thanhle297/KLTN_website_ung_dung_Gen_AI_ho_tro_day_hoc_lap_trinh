import React, { useState, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import LayoutSimple from "../components/LayoutSimple";
import LayoutSimpleMobile from "../components/LayoutSimpleMobile";
import DifficultySlider from "../components/DifficultySlider";
import SubmitButton from "../components/SubmitButton";
import LoadingSpinner from "../components/LoadingSpinner";
import useLessonQuestions from "../hook/useLessonQuestions";
import useIsMobile from "../hook/useIsMobile";
import { HeaderContext } from "../context/HeaderContext";
import "../styles/CodeEx.scss";

export default function CodeExSimple() {
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
  const {
    lesson,
    questions,
    current,
    setCurrent,
    editorStates,
    setEditorStates,
    loading,
  } = useLessonQuestions(lessonId, userId, classId); // ✅ dùng cùng hook với CodeEx
  const [difficulty, setDifficulty] = useState(0);
  const { showHeader, setShowHeader } = useContext(HeaderContext);

  if (loading) return <LoadingSpinner label="Đang tải dữ liệu..." />;
  if (!questions || questions.length === 0 || !current)
    return <p>Không có câu hỏi nào cho bài này.</p>;

  return (
    <div className="code-ex-page">
      <div className="top-bar">
        <div
          className="left"
          style={{ display: "flex", alignItems: "center", gap: "15px" }}
        >
          <button
            type="button"
            onClick={() => setShowHeader(!showHeader)}
            className="toggle-header-btn"
            title={showHeader ? "Ẩn Header" : "Hiện Header"}
            aria-label={showHeader ? "Ẩn thanh điều hướng" : "Hiện thanh điều hướng"}
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
              courseId={lesson?.courseId}
              editorStates={editorStates}
            />
          )}
        </div>
      </div>

      {isMobile ? (
        <LayoutSimpleMobile
          questions={questions}
          current={current}
          setCurrent={setCurrent}
          editorStates={editorStates}
          updateEditorState={(id, s) =>
            setEditorStates((prev) => ({ ...prev, [id]: { ...prev[id], ...s } }))
          }
          difficulty={difficulty}
          lessonId={lessonId}
          userId={userId}
          lessonNumber={lesson?.lessonNumber}
        />
      ) : (
        <LayoutSimple
          questions={questions}
          current={current}
          setCurrent={setCurrent}
          editorStates={editorStates}
          updateEditorState={(id, s) =>
            setEditorStates((prev) => ({ ...prev, [id]: { ...prev[id], ...s } }))
          }
          difficulty={difficulty}
          lessonId={lessonId}
          userId={userId}
          lessonNumber={lesson?.lessonNumber}
        />
      )}
    </div>
  );
}

