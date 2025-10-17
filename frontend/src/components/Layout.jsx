// components/Layout.jsx
import QuestionPanel from "./QuestionPanel";
import CodeEditor from "./CodeEditor";
import QuestionList from "./QuestionList";
import Popup from "./Popup";
import { useState } from "react";
import "../styles/Layout.scss";

export default function Layout({
  questions,
  current,
  editorStates,
  setCurrent,
  updateEditorState,
  difficulty, // 🔹 nhận thêm prop từ CodeEx
}) {
  const [popupData, setPopupData] = useState(null);

  if (!current) return null;
  const currentIndex = questions.findIndex((q) => q.id === current.id);

  const handleExecuteResponse = (aiData) => {
    // 🔹 Chỉ hiển thị popup khi có dữ liệu AI và không phải mức Khó
    if (difficulty !== 2 && aiData) {
      setPopupData(aiData);
    } 
  };

  return (
    <div className="layout">
      <div className="layout__left">
        <div className={`left-content ${popupData ? "blur" : ""}`}>
          <QuestionList questions={questions} setCurrent={setCurrent} />
          <QuestionPanel current={current} index={currentIndex} />
        </div>

        {popupData && (
          <Popup data={popupData} onClose={() => setPopupData(null)} />
        )}
      </div>

      <div className="layout__right">
        <CodeEditor
          code={editorStates[current.id]?.code || ""}
          result={editorStates[current.id]?.result || ""}
          question={current}
          difficulty={difficulty} // ✅ truyền difficulty sang CodeEditor
          onChangeCode={(newCode) =>
            updateEditorState(current.id, { code: newCode })
          }
          onChangeResult={(newResult) =>
            updateEditorState(current.id, { result: newResult })
          }
          onExecuteResponse={handleExecuteResponse}
        />
      </div>
    </div>
  );
}
