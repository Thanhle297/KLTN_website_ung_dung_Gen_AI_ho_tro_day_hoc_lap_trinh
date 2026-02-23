import "../styles/QuestionList.scss";

export default function QuestionList({
  questions,
  setCurrent,
  editorStates,
  currentId,
}) {
  return (
    <div className="question-list">
      {questions.map((q, idx) => {
        // Lấy ID của câu hiện tại trong danh sách
        const qId = q.id || q._id;

        // Kiểm tra xem có trùng với ID của 'current' đang được chọn không
        // isActive sẽ TRUE nếu currentId trùng với bất kỳ ID nào của câu hỏi
        const isActive =
          (q.id && q.id === currentId) ||
          (q._id && q._id === currentId) ||
          qId === currentId;

        const status = editorStates[q.id]?.status;

        const btnClass = [
          status === "correct" ? "correct" : status === "wrong" ? "wrong" : "",
          isActive ? "active" : "",
        ]
          .join(" ")
          .trim();

        return (
          <button
            key={qId || idx}
            type="button"
            onClick={() => setCurrent(q)}
            className={btnClass}
          >
            Câu {idx + 1}
          </button>
        );
      })}
    </div>
  );
}
