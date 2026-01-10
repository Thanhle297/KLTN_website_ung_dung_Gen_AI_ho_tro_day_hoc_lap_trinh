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

  if (!current) return <p>Đang tải câu hỏi...</p>;
  const currentIndex = questions.findIndex((q) => q.id === current.id);

  const handleExecuteResponse = (result) => {
    if (!result) return;
    if (result.questionId && result.simpleStatus) {
      updateEditorState(result.questionId, { status: result.simpleStatus });
    }

    const joinedGuide = result.instructs?.join(" ") || "";
    const isCompleted = /đáp ứng đầy đủ yêu cầu/i.test(joinedGuide);

    if (isCompleted) {
      setPopupData({
        mode: "instruct_only",
        instructs: [
          "🎉 Chúc mừng! Bạn đã hoàn thành chính xác tất cả yêu cầu của đề bài.",
          ...result.instructs,
        ],
      });
    } else {
      setPopupData({
        mode: "instruct_only",
        instructs:
          result.instructs && result.instructs.length > 0
            ? result.instructs
            : ["AI không có hướng dẫn cụ thể."],
      });
    }
  };

  return (
    <div className="layout">
      {/* Cột trái */}
      <div className="layout__left">
        <div className={`left-content ${popupData ? "blur" : ""}`}>
          <QuestionList
            questions={questions}
            setCurrent={setCurrent}
            editorStates={editorStates}
          />
          <QuestionPanel current={current} index={currentIndex} />
        </div>

        {popupData && (
          <Popup data={popupData} onClose={() => setPopupData(null)} />
        )}
      </div>

      {/* Cột phải */}
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
