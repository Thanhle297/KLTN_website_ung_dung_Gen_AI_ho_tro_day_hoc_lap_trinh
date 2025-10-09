// components/Popup.jsx
import React, { useState, useEffect } from "react";
import { FaTimes, FaForward } from "react-icons/fa";
import character from "../IMG/Picture1.png";
import "../styles/Popup.scss";

export default function FETestPopup({ data, onClose }) {
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!data) return;

    const seq = [];
    data.instructs?.forEach((ins) =>
      seq.push({ type: "instruct", value: ins })
    );

    data.quizzes?.forEach((quiz) => {
      const qMatch = quiz.match(/<question>([\s\S]*?)<\/question>/);
      const question = qMatch ? qMatch[1].trim() : "";

      const ansMatches = [...quiz.matchAll(/<ans>([\s\S]*?)<\/ans>/g)];
      const answers = ansMatches.map((m) => m[1].trim());

      const correctIndex = answers.findIndex((a) => a.includes("<correct>"));
      const cleanAnswers = answers.map((a) =>
        a.replace(/<\/?correct>/g, "")
      );

      seq.push({
        type: "quiz",
        question,
        answers: cleanAnswers,
        correctIndex,
      });
    });

    data.answers?.forEach((ans) =>
      seq.push({ type: "answer", value: ans })
    );

    setSequence(seq);
    setCurrentIndex(0);
  }, [data]);

  if (!data) return null;
  if (!sequence.length) return null;

  const item = sequence[currentIndex];

  const handleNext = () => {
    if (item.type === "quiz") {
      if (selected === item.correctIndex) {
        setSelected(null);
        setCurrentIndex((i) => Math.min(i + 1, sequence.length - 1));
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    } else {
      setSelected(null);
      setCurrentIndex((i) => Math.min(i + 1, sequence.length - 1));
    }
  };

  return (
    <div className="popup-overlay">
      <div className={`popup ${shake ? "shake" : ""}`}>
        <button className="popup-close" onClick={onClose}>×</button>

        <div className="popup-body">
          <div className="character">
            <img src={character} alt="Gia sư" />
          </div>

          <div className="content">
            {item.type === "instruct" && (
              <div>
                <h3>Hướng dẫn</h3>
                <div className="instruct-block">
                  {item.value
                    .split("#")
                    .filter((line) => line.trim() !== "")
                    .map((line, idx) => (
                      <p key={idx}>#{line.trim()}</p>
                    ))}
                </div>
              </div>
            )}

            {item.type === "quiz" && (
              <div>
                <h3>Câu hỏi</h3>
                <p>{item.question}</p>
                <div className="answers">
                  {item.answers.map((opt, idx) => (
                    <button
                      key={idx}
                      className={selected === idx ? "selected" : ""}
                      onClick={() => setSelected(idx)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {item.type === "answer" && (
              <div>
                <h3>Chỉnh sửa đúng</h3>
                <pre>{item.value}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="popup-footer">
          {currentIndex < sequence.length - 1 ? (
            <button onClick={handleNext}><FaForward /></button>
          ) : (
            <button onClick={onClose}>Hoàn thành</button>
          )}
        </div>
      </div>
    </div>
  );
}
