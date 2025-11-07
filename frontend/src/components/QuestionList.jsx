import "../styles/QuestionList.scss";

export default function QuestionList({ questions, setCurrent, editorStates }) {
  return (
    <div className="question-list">
      {questions.map((q, idx) => {
        const status = editorStates[q.id]?.status;
        const btnClass =
          status === "correct"
            ? "correct"
            : status === "wrong"
            ? "wrong"
            : "";

        return (
          <button
            key={q._id || q.id || idx}
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
