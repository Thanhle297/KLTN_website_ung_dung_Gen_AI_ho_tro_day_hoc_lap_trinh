import React, { useState } from "react";
import QuestionPanel from "./QuestionPanel";
import CodeEditorSimple from "./CodeEditorSimple";
import QuestionList from "./QuestionList";
import Popup from "./Popup";
import "../styles/LayoutMobile.scss";

export default function LayoutSimpleMobile({
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

  const handleExecuteResponse = (result) => {
    if (!result) return;

    const isCorrect = result.simpleStatus === "correct";

    if (isCorrect) {
      setPopupData({
        mode: "instruct_only",
        instructs: ["✅ Bài làm đạt yêu cầu."],
      });
      // No strict need to switch tab if popup shows, but let's switch to code to see details if any
    } else {
        // Logic copy from LayoutSimple.jsx
        if (difficulty === 2) {
            setPopupData({
              mode: "instruct_only",
              instructs: ["❌ Bài làm chưa đạt yêu cầu."],
            });
        } else if (difficulty === 1) {
            setPopupData({
              mode: "instruct_only",
              instructs: result.instructs || [],
            });
        } else {
            const hasQuizzes = result.quizzes && result.quizzes.length > 0;
            setPopupData({
              mode: hasQuizzes ? "full" : "instruct_only",
              instructs: result.instructs || [],
              quizzes: result.quizzes || [],
            });
        }
    }
    
    // Switch to code tab which contains result/terminal
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
          className={activeTab === "question" ? "active" : ""}
          onClick={() => setActiveTab("question")}
        >
          Đề bài
        </button>
        <button 
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

        {/* Code Tab: Render CodeEditorSimple */}
        <div style={{ display: activeTab === "code" ? "block" : "none", height: "100%" }}>
            <CodeEditorSimple
                question={current}
                editorStates={editorStates}
                updateEditorState={updateEditorState}
                difficulty={difficulty}
                lessonId={lessonId}
                userId={userId}
                onChangeCode={(v) => updateEditorState(current.id, { code: v })}
                onChangeInput={(v) => updateEditorState(current.id, { input: v })}
                onChangeResult={(v) => updateEditorState(current.id, { result: v })}
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
