import "../styles/QuestionList.scss";

export default function QuestionList({ questions, setCurrent }) {
  
  return (
    <div className="question-list">
      {questions.map((q) => (
        <button key={q.id} onClick={() => setCurrent(q)}>
          Câu {q.id}
        </button>
      ))}
      
    </div>
  );
}
