import "../styles/QuestionPanel.scss";

export default function QuestionPanel({ current }) {

  return (
    <div className="question-panel">
      {/* <h2>Câu hỏi</h2> */}
      <div
        className="question-text"
        dangerouslySetInnerHTML={{
          __html: current.question.replace(/&nbsp;/g, " "),
        }}
      />

      <div className="question-panel__io">
        <h3>Ví dụ: </h3>
        <table border={1} aria-label="Ví dụ Input/Output">
          <thead>
            <tr>
              <th>Input</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {current.ex.map((t, idx) => (
              <tr key={idx}>
                <td>
                  <pre>{t.input}</pre>
                </td>
                <td>
                  <pre>{t.output}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
