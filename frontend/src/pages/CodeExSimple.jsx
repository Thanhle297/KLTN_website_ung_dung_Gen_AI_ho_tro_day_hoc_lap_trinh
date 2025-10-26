import React, { useState } from "react";
import { useParams } from "react-router-dom";
import LayoutSimple from "../components/LayoutSimple";
// import DifficultySlider from "../components/DifficultySlider";
// import SubmitButton from "../components/SubmitButton";
import LoadingSpinner from "../components/LoadingSpinner";
import useLessonQuestions from "../hook/useLessonQuestions";
import "../styles/CodeEx.scss";

export default function CodeExSimple() {
  const { lessonId } = useParams();
  const userId = localStorage.getItem("userId");
  const {
    lesson,
    questions,
    current,
    setCurrent,
    editorStates,
    setEditorStates,
    loading,
  } = useLessonQuestions(lessonId, userId); // ✅ dùng cùng hook với CodeEx
  const [difficulty, setDifficulty] = useState(0);

  if (loading) return <LoadingSpinner label="Đang tải dữ liệu..." />;
  if (!questions || questions.length === 0 || !current)
    return <p>Không có câu hỏi nào cho bài này.</p>;

  return (
    <>
      {/* <div className="top-bar">
        <div className="left">
          <DifficultySlider onChange={setDifficulty} />
        </div>
        <div className="right">
          {lesson && (
            <SubmitButton
              userId={userId}
              lessonId={lessonId}
              courseId={lesson.courseId}
            />
          )}
        </div>
      </div> */}

      <LayoutSimple
        questions={questions}
        current={current}
        setCurrent={setCurrent}
        editorStates={editorStates}
        updateEditorState={(id, newState) =>
          setEditorStates((prev) => ({
            ...prev,
            [id]: { ...prev[id], ...newState },
          }))
        }
        difficulty={difficulty}
        lessonId={lessonId}
        userId={userId}
      />
    </>
  );
}
