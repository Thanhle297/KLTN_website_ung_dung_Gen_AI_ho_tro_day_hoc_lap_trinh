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
  lessonNumber,
}) {
  const [popupData, setPopupData] = useState(null);

  if (!current) return null;
  const currentIndex = questions.findIndex((q) => q.id === current.id);

  const handleExecuteResponse = (result) => {
    if (!result) return;

    const isCorrect = result.simpleStatus === "correct";

    // Nếu làm ĐÚNG: tất cả difficulty đều hiển thị thông báo PASS
    if (isCorrect) {
      setPopupData({
        mode: "instruct_only",
        instructs: ["✅ Bài làm đạt yêu cầu."],
      });
      return;
    }

    // Từ đây trở xuống là xử lý khi làm SAI

    // Level 2: chỉ kết luận FAIL
    if (difficulty === 2) {
      setPopupData({
        mode: "instruct_only",
        instructs: ["❌ Bài làm chưa đạt yêu cầu."],
      });
      return;
    }

    // Level 1: chỉ hướng dẫn, không quiz
    if (difficulty === 1) {
      setPopupData({
        mode: "instruct_only",
        instructs: result.instructs || [],
      });
      return;
    }

    // Level 0: hướng dẫn + quiz (nếu có)
    const hasQuizzes = result.quizzes && result.quizzes.length > 0;
    setPopupData({
      mode: hasQuizzes ? "full" : "instruct_only",
      instructs: result.instructs || [],
      quizzes: result.quizzes || [],
    });
  };

  return (
    <div className="layout">
      <div className="layout__left">
        <QuestionList
          currentId={current.id}
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
          lessonNumber={lessonNumber}
        />
      </div>
    </div>
  );
}
