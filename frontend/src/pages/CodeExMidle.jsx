// pages/CodeExMidle.jsx — Middle Mode (testcase + AI logic 3-tier)
import React, { useState, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import LayoutMiddle from "../components/LayoutMiddle";
import LayoutMiddleMobile from "../components/LayoutMiddleMobile";
import DifficultySlider from "../components/DifficultySlider";
import SubmitButton from "../components/SubmitButton";
import LoadingSpinner from "../components/LoadingSpinner";
import useLessonQuestions from "../hook/useLessonQuestions";
import useIsMobile from "../hook/useIsMobile";
import { HeaderContext } from "../context/HeaderContext";
import "../styles/CodeEx.scss";

export default function CodeExMidle() {
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
  } = useLessonQuestions(lessonId, userId, classId);

  const [difficulty, setDifficulty] = useState(0);
  const { showHeader, setShowHeader } = useContext(HeaderContext);

  if (loading) return <LoadingSpinner label="Dang tai du lieu..." />;
  if (!questions || questions.length === 0 || !current)
    return <p>Khong co cau hoi nao cho bai nay.</p>;

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
            type="button"
            onClick={() => setShowHeader(!showHeader)}
            className="toggle-header-btn"
            title={showHeader ? "An Header" : "Hien Header"}
            aria-label={
              showHeader ? "An thanh dieu huong" : "Hien thanh dieu huong"
            }
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
        <LayoutMiddleMobile
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
        <LayoutMiddle
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
