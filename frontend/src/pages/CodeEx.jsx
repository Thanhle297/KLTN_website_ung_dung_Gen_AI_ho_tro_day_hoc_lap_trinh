// CodeEx.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import DifficultySlider from "../components/DifficultySlider";
import SubmitButton from "../components/SubmitButton";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/CodeEx.scss"

export default function CodeEx() {
  const { lessonId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [editorStates, setEditorStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState(0); // 0 = Dễ, 1 = Khá, 2 = Khó

  useEffect(() => {
    if (!lessonId) return;

    fetch(`http://localhost:3001/api/question?lessonId=${lessonId}`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        if (data.length > 0) {
          setCurrent(data[0]);
          setEditorStates(
            Object.fromEntries(
              data.map((q) => [q.id, { code: q.defaultCode || "", result: "" }])
            )
          );
        }
      })
      .catch((err) => console.error("❌ Lỗi load questions:", err))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const updateEditorState = (id, newState) => {
    setEditorStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...newState },
    }));
  };

  if (loading) return <LoadingSpinner label="Đang tải câu hỏi..." />;
  if (!current) return <p>Không có câu hỏi nào cho bài này.</p>;

  return (
    <>
      <div className="top-bar">
        <div className="left">
          <DifficultySlider onChange={setDifficulty} />
        </div>
        <div className="right">
          <SubmitButton />
        </div>
      </div>

      {/* <DifficultySlider onChange={setDifficulty} />
      <SubmitButton/> */}
      <Layout
        questions={questions}
        current={current}
        editorStates={editorStates}
        setCurrent={setCurrent}
        updateEditorState={updateEditorState}
        difficulty={difficulty}
      />
    </>
  );
}
