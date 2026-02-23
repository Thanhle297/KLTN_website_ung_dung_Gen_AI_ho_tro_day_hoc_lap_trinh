import React, { useState } from "react";
import QuestionPanel from "./QuestionPanel";
import CodeEditor from "./CodeEditor";
import QuestionList from "./QuestionList";
import Popup from "./Popup";
import "../styles/LayoutMobile.scss";

export default function LayoutMobile({
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

  const handleExecuteResponse = (aiData) => {
    if (!aiData) return;

    if (aiData.questionId && aiData.autoStatus) {
      updateEditorState(aiData.questionId, { status: aiData.autoStatus });
    }

    if (difficulty !== 2 && aiData.mode) {
        setPopupData(aiData);
    }
    
    // Switch to code tab to see feedback in the editor's internal tabs
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
          Đề bài
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

        {/* Render CodeEditor always to keep state, but hide when inactive */}
        <div style={{ display: activeTab === "code" ? "block" : "none", height: "100%" }}>
            <CodeEditor
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
