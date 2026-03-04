// components/LayoutMiddleMobile.jsx
import React, { useState } from "react";
import fireConfetti from "../utils/fireConfetti";
import QuestionPanel from "./QuestionPanel";
import CodeEditorMiddle from "./CodeEditorMiddle";
import QuestionList from "./QuestionList";
import Popup from "./Popup";
import "../styles/LayoutMobile.scss";

export default function LayoutMiddleMobile({
  questions,
  current,
  editorStates,
  setCurrent,
  updateEditorState,
  difficulty,
  lessonId,
  userId,
  lessonNumber,
}) {
  const [activeTab, setActiveTab] = useState("question"); // question, code
  const [popupData, setPopupData] = useState(null);

  if (!current) return null;
  const currentIndex = questions.findIndex((q) => q.id === current.id);

  const handleExecuteResponse = (data) => {
    if (!data) return;

    if (data.questionId && data.combinedStatus) {
      updateEditorState(data.questionId, { status: data.combinedStatus });
    }

    const status = data.combinedStatus;

    // Correct + confetti
    if (status === "correct") {
      fireConfetti();
      setPopupData({
        mode: "instruct_only",
        instructs: ["Bài làm đạt yêu cầu, chúc mừng!"],
      });
      setActiveTab("code");
      return;
    }

    // difficulty 2: chi ket qua
    if (difficulty === 2) {
      const msg =
        status === "partial"
          ? "Bài làm đúng một phần. Hãy kiểm tra lại logic code."
          : "Bài làm chưa đạt yêu cầu.";
      setPopupData({
        mode: "instruct_only",
        instructs: [msg],
      });
      setActiveTab("code");
      return;
    }

    // difficulty 1: chi instructs
    if (difficulty === 1) {
      const instructs =
        data.instructs && data.instructs.length > 0
          ? data.instructs
          : [
              status === "partial"
                ? "Bài làm đúng một phần. Hay xem lại các testcase thất bại và logic code."
                : "Bài làm chưa đạt yêu cầu. Hãy thử lại.",
            ];
      setPopupData({
        mode: "instruct_only",
        instructs,
      });
      setActiveTab("code");
      return;
    }

    // difficulty 0: full
    const hasQuizzes = data.quizzes && data.quizzes.length > 0;
    const instructs =
      data.instructs && data.instructs.length > 0
        ? data.instructs
        : [
            status === "partial"
              ? "Bài làm đúng một phần. Hay xem lại hướng dẫn bên dưới."
              : "Bài làm chưa đạt yêu cầu. Hãy đọc hướng dẫn để hiểu thêm.",
          ];

    setPopupData({
      mode: hasQuizzes ? "full" : "instruct_only",
      instructs,
      quizzes: data.quizzes || [],
    });

    setActiveTab("code");
  };

  return (
    <div className="layout-mobile">
      {/* 1. Question List (Horizontal Scroll) */}
      <div className="layout-mobile__question-list">
        <QuestionList
          currentId={current.id}
          questions={questions}
          setCurrent={setCurrent}
          editorStates={editorStates}
        />
      </div>

      {/* 2. Tabs Navigation */}
      <div className="layout-mobile__tabs">
        <button
          type="button"
          className={activeTab === "question" ? "active" : ""}
          onClick={() => setActiveTab("question")}
        >
          De bai
        </button>
        <button
          type="button"
          className={activeTab === "code" ? "active" : ""}
          onClick={() => setActiveTab("code")}
        >
          Code
        </button>
      </div>

      {/* 3. Main Content */}
      <div className="layout-mobile__content">
        {activeTab === "question" && (
          <QuestionPanel current={current} index={currentIndex} />
        )}

        <div
          style={{
            display: activeTab === "code" ? "block" : "none",
            height: "100%",
          }}
        >
          <CodeEditorMiddle
            code={editorStates[current.id]?.code || ""}
            result={editorStates[current.id]?.result || ""}
            question={current}
            difficulty={difficulty}
            userId={userId}
            lessonId={lessonId}
            updateEditorState={updateEditorState}
            editorStates={editorStates}
            onChangeCode={(newCode) =>
              updateEditorState(current.id, { code: newCode })
            }
            onChangeResult={(newResult) =>
              updateEditorState(current.id, { result: newResult })
            }
            onExecuteResponse={handleExecuteResponse}
            lessonNumber={lessonNumber}
          />
        </div>
      </div>

      {popupData && (
        <Popup data={popupData} onClose={() => setPopupData(null)} />
      )}
    </div>
  );
}
