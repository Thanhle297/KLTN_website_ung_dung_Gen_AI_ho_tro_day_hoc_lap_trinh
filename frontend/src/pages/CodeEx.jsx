import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import DifficultySlider from "../components/DifficultySlider";

export default function CodeEx() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [editorStates, setEditorStates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/questions")
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
  }, []);

  const updateEditorState = (id, newState) => {
    setEditorStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...newState },
    }));
  };

  if (loading) {
    return <LoadingSpinner label="Đang tải câu hỏi..." />;
  }

  if (!current) {
    return <LoadingSpinner label="Đang tải câu hỏi..." />;
  }

  return (
    <div>
      {/* <DifficultySlider/> */}
      <Layout
        questions={questions}
        current={current}
        editorStates={editorStates}
        setCurrent={setCurrent}
        updateEditorState={updateEditorState}
      />
    </div>
  );
}
