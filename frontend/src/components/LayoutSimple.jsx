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

  const handleExecuteResponse = (aiData) => {
    if (difficulty !== 2 && aiData) setPopupData(aiData);
  };

  return (
    <div className="layout">
      {/* Cột trái: danh sách câu hỏi + nội dung câu hỏi */}
      <div className="layout__left">
        <div className={`left-content ${popupData ? "blur" : ""}`}>
          <QuestionList questions={questions} setCurrent={setCurrent} />
          <QuestionPanel current={current} index={currentIndex} />
        </div>

        {popupData && (
          <Popup data={popupData} onClose={() => setPopupData(null)} />
        )}
      </div>

      {/* Cột phải: vùng code */}
      <div className="layout__right">
        <CodeEditorSimple
          code={editorStates[current.id]?.code || ""}
          question={current}
          difficulty={difficulty}
          userId={userId}
          lessonId={lessonId}
          onChangeCode={(newCode) =>
            updateEditorState(current.id, { code: newCode })
          }
          onChangeResult={(r) => updateEditorState(current.id, { result: r })}
          onExecuteResponse={handleExecuteResponse}
        />
      </div>
    </div>
  );
}
