import "../styles/QuestionPanel.scss";
import { useEffect } from "react";

export default function QuestionPanel({ current }) {
  useEffect(() => {
    console.log("QUESTION HTML:", current.question);
  }, [current]);

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
        <table border={1}>
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
