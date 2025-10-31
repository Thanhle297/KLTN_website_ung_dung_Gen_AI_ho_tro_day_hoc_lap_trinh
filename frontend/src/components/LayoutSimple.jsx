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

    const joinedGuide = result.instructs?.join(" ") || "";

    // ✅ Nếu AI xác nhận “đúng và đầy đủ yêu cầu” → Hoàn thành
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
      // ❌ Nếu chưa hoàn thành hoặc có góp ý từ AI → chỉ hiển thị hướng dẫn
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
          <QuestionList questions={questions} setCurrent={setCurrent} />
          <QuestionPanel current={current} index={currentIndex} />
        </div>

        {popupData && (
          <Popup data={popupData} onClose={() => setPopupData(null)} />
        )}
      </div>

      {/* Cột phải */}
      <div className="layout__right">
        <CodeEditorSimple
          code={editorStates[current.id]?.code || ""}
          input={editorStates[current.id]?.input || ""}
          question={current}
          difficulty={difficulty}
          userId={userId}
          lessonId={lessonId}
          onChangeCode={(newCode) =>
            updateEditorState(current.id, { code: newCode })
          }
          onChangeInput={(newInput) =>
            updateEditorState(current.id, { input: newInput })
          }
          onChangeResult={(r) => updateEditorState(current.id, { result: r })}
          onExecuteResponse={handleExecuteResponse}
        />
      </div>
    </div>
  );
}
