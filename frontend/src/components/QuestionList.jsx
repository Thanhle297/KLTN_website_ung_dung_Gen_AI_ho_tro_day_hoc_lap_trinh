import "../styles/QuestionList.scss";

export default function QuestionList({ questions, setCurrent }) {
  return (
    <div className="question-list">
      {questions.map((q, idx) => (
        <button key={q._id || q.id || idx} onClick={() => setCurrent(q)}>
          Câu {idx + 1}
        </button>
      ))}
    </div>
  );
}

