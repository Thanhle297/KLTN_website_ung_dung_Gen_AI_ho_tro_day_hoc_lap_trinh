import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import DifficultySlider from "../components/DifficultySlider";
import SubmitButton from "../components/SubmitButton";
import LoadingSpinner from "../components/LoadingSpinner";
import useLessonQuestions from "../hook/useLessonQuestions";
import "../styles/CodeEx.scss";

export default function CodeEx() {
  const { lessonId } = useParams();
  const userId = localStorage.getItem("userId");
  const [difficulty, setDifficulty] = useState(0);

  // ✅ Dùng custom hook
  const {
    lesson,
    questions,
    current,
    setCurrent,
    editorStates,
    setEditorStates,
    loading,
  } = useLessonQuestions(lessonId, userId);

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
    <>
      <div className="top-bar">
        <div className="left">
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

      <Layout
        questions={questions}
        current={current}
        editorStates={editorStates}
        setCurrent={setCurrent}
        updateEditorState={updateEditorState}
        difficulty={difficulty}
        lessonId={lessonId}
        userId={userId}
      />
    </>
  );
}
