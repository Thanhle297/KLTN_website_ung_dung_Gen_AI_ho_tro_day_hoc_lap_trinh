// components/LayoutMiddle.jsx
import QuestionPanel from "./QuestionPanel";
import CodeEditorMiddle from "./CodeEditorMiddle";
import QuestionList from "./QuestionList";
import Popup from "./Popup";
import { useState } from "react";
import "../styles/Layout.scss";

export default function LayoutMiddle({
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

  /**
   * handleExecuteResponse nhan du lieu tu CodeEditorMiddle sau khi goi /api/execute-middle
   * Data shape: { mode, instructs, quizzes, combinedStatus, aiResult, questionId }
   */
  const handleExecuteResponse = (data) => {
    if (!data) return;

    // Cap nhat trang thai cau hoi (correct / partial / wrong)
    if (data.questionId && data.combinedStatus) {
      updateEditorState(data.questionId, { status: data.combinedStatus });
    }

    const status = data.combinedStatus;

    // --- Correct: thong bao ngan ---
    if (status === "correct") {
      setPopupData({
        mode: "instruct_only",
        instructs: ["Bài làm đạt yêu cầu, chúc mừng!"],
      });
      return;
    }

    // --- difficulty 2: chi ket qua, khong goi y ---
    if (difficulty === 2) {
      const msg =
        status === "partial"
          ? "Bài làm đúng một phần. Hãy kiểm tra lại logic code."
          : "Bài làm chưa đạt yêu cầu.";
      setPopupData({
        mode: "instruct_only",
        instructs: [msg],
      });
      return;
    }

    // --- difficulty 1: chi instructs ---
    if (difficulty === 1) {
      const instructs =
        data.instructs && data.instructs.length > 0
          ? data.instructs
          : [
              status === "partial"
                ? "Bài làm đúng một phần. Hay xem lại các testcase thất bại và logic code."
                : "Bài làm chưa đạt yêu cầu. Hãy thử lại.",
            ];
      setPopupData({
        mode: "instruct_only",
        instructs,
      });
      return;
    }

    // --- difficulty 0: full (instructs + quizzes) ---
    const hasQuizzes = data.quizzes && data.quizzes.length > 0;
    const instructs =
      data.instructs && data.instructs.length > 0
        ? data.instructs
        : [
            status === "partial"
              ? "Bài làm đúng một phần. Hay xem lại hướng dẫn bên dưới."
             : "Bài làm chưa đạt yêu cầu. Hãy đọc hướng dẫn để hiểu thêm.",
          ];

    setPopupData({
      mode: hasQuizzes ? "full" : "instruct_only",
      instructs,
      quizzes: data.quizzes || [],
    });
  };

  return (
    <div className="layout">
      <div className="layout__left">
        <div className={`left-content ${popupData ? "blur" : ""}`}>
          <QuestionList
            currentId={current.id}
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

      <div className="layout__right">
        <CodeEditorMiddle
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
  );
}
