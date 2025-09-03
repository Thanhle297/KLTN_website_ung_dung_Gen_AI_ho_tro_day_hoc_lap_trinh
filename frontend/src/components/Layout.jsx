import { useState } from "react";
import QuestionPanel from "./QuestionPanel";
import CodeEditor from "./CodeEditor";
import QuestionList from "./QuestionList";
// import ToggleContent from "./ToggleContent";
import "../styles/Layout.scss";



export default function Layout({ questions }) {
  const [current, setCurrent] = useState(questions[0]);

  // lưu code + result riêng cho từng câu hỏi
  const [editorStates, setEditorStates] = useState(
    Object.fromEntries(
      questions.map((q) => [
        q.id,
        { code: q.defaultCode || "", result: "" }, // init mỗi câu
      ])
    )
  );

  // cập nhật khi user code / run
  const updateEditorState = (id, newState) => {
    setEditorStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...newState },
    }));
  };

  return (
    <div className="layout">
      <div className="layout__left">
        <QuestionList questions={questions} setCurrent={setCurrent} />
        <QuestionPanel current={current} />
      </div>
      <div className="layout__right">
        <CodeEditor
          code={editorStates[current.id].code}
          result={editorStates[current.id].result}
          question={current}
          onChangeCode={(newCode) =>
            updateEditorState(current.id, { code: newCode })
          }
          onChangeResult={(newResult) =>
            updateEditorState(current.id, { result: newResult })
          }
        />
        {/* <ToggleContent/> */}
      </div>
    </div>
  );
}
