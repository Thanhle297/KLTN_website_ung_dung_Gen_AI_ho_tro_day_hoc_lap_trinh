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
}) {
  const [popupData, setPopupData] = useState(null);

  if (!current) return null;

  return (
    <div className="layout">
      <div className="layout__left">
        <div className={`left-content ${popupData ? "blur" : ""}`}>
          <QuestionList questions={questions} setCurrent={setCurrent} />
          <QuestionPanel current={current} />
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
          onChangeCode={(newCode) =>
            updateEditorState(current.id, { code: newCode })
          }
          onChangeResult={(newResult) =>
            updateEditorState(current.id, { result: newResult })
          }
          onExecuteResponse={(aiData) => setPopupData(aiData)} // nhận trực tiếp từ execute
        />
      </div>
    </div>
  );
}
