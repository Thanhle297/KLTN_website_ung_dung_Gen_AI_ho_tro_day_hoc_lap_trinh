import QuestionPanel from "./QuestionPanel";
import CodeEditorSimple from "./CodeEditorSimple";
import QuestionList from "./QuestionList";
import Popup from "./Popup";
import { useState } from "react";
import "../styles/LayoutSimple.scss";

export default function LayoutSimple({
  questions,
  current,
  editorStates,
  setCurrent,
  updateEditorState,
  difficulty,
  lessonId,
  userId,
}) {
  const [popupData, setPopupData] = useState(null);


  if (!current) return null;
  const currentIndex = questions.findIndex((q) => q.id === current.id);

  const handleExecuteResponse = (result) => {
    if (!result) return;

    // ✅ Level 2: chỉ kết luận
    if (difficulty === 2) {
      setPopupData({
        mode: "instruct_only",
        instructs:
          result.simpleStatus === "correct"
            ? ["✅ Bài làm đạt yêu cầu."]
            : ["❌ Bài làm chưa đạt yêu cầu."],
      });
      return;
    }

    // Level 0–1: giữ logic cũ
    setPopupData({
      mode: "instruct_only",
      instructs: result.instructs || [],
    });
  };

  return (
    <div className="layout">
      <div className="layout__left">
        <QuestionList
          questions={questions}
          setCurrent={setCurrent}
          editorStates={editorStates}
        />
        <QuestionPanel current={current} index={currentIndex} />

        {popupData && (
          <Popup data={popupData} onClose={() => setPopupData(null)} />
        )}
      </div>

      <div className="layout__right">
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
        />
      </div>
    </div>
  );
}
