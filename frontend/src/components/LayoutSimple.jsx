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

    if (result.success) {
      // ✅ Nếu đúng: tạo popup "Hoàn thành"
      setPopupData({
        mode: "instruct_only",
        instructs: ["🎉 Code của bạn chạy đúng, chúc mừng bạn đã hoàn thành!"],
      });
    } else {
      // ❌ Nếu sai: hiển thị hướng dẫn từ AI
      setPopupData({
        mode: "instruct_only",
        instructs: result.instructs || ["AI không có hướng dẫn cụ thể."],
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
          onExecuteResponse={handleExecuteResponse} // ✅ xử lý popup
        />
      </div>
    </div>
  );
}
