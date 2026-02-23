// components/Popup.jsx
import React, { useState, useEffect } from "react";
import { FaTimes, FaForward } from "react-icons/fa";
import character from "../IMG/Picture1.png";
import correctSound from "../sounds/correct.mp3";
import wrongSound from "../sounds/wrong.mp3";
import "../styles/Popup.scss";

export default function FETestPopup({ data, onClose }) {
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!data) return;

    const seq = [];

    // Luôn thêm phần hướng dẫn
    data.instructs?.forEach((ins) =>
      seq.push({ type: "instruct", value: ins })
    );

    // Nếu không ở chế độ hướng dẫn thì thêm quiz và answer
    if (data.mode !== "instruct_only") {
      data.quizzes?.forEach((quiz) => {
        // Kiểm tra format: JSON mới hay XML cũ
        if (typeof quiz === "object" && quiz.question) {
          // FORMAT MỚI (JSON từ callPromtSimple) - đã có sẵn cấu trúc
          seq.push({
            type: "quiz",
            question: quiz.question,
            answers: quiz.answers || [],
            correctIndex: quiz.correctIndex ?? 0,
          });
        } else if (typeof quiz === "string") {
          // FORMAT CŨ (XML từ callpromt.js) - cần parse
          const qMatch = quiz.match(/<question>([\s\S]*?)<\/question>/);
          const question = qMatch ? qMatch[1].trim() : "";

          const ansMatches = [...quiz.matchAll(/<ans>([\s\S]*?)<\/ans>/g)];
          const answers = ansMatches.map((m) => m[1].trim());

          const correctIndex = answers.findIndex((a) =>
            a.includes("<correct>")
          );
          const cleanAnswers = answers.map((a) =>
            a.replace(/<\/?correct>/g, "")
          );

          seq.push({
            type: "quiz",
            question,
            answers: cleanAnswers,
            correctIndex,
          });
        }
      });

      data.answers?.forEach((ans) => seq.push({ type: "answer", value: ans }));
    }

    setSequence(seq);
    setCurrentIndex(0);
  }, [data]);

  if (!data || !sequence.length) return null;

  const item = sequence[currentIndex];

  const handleNext = () => {
    if (item.type === "quiz") {
      if (selected === item.correctIndex) {
        new Audio(correctSound).play(); // ✅ âm thanh đúng
        setSelected(null);
        setCurrentIndex((i) => Math.min(i + 1, sequence.length - 1));
      } else {
        new Audio(wrongSound).play(); // ❌ âm thanh sai
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
      <div className={`popup ${shake ? "shake" : ""}`} role="dialog" aria-modal="true" aria-label="Hướng dẫn AI">
        <button type="button" className="popup-close" onClick={onClose} aria-label="Đóng">
          <FaTimes />
        </button>

        <div className="popup-body">
          <div className="character">
            <img src={character} alt="Gia sư" width={120} height={120} />
          </div>

          <div className="content">
            {/* --------- HƯỚNG DẪN --------- */}
            {item.type === "instruct" && (
              <div>
                <h2>Hướng dẫn</h2>
                <div className="instruct-block">
                  {item.value
                    .split("#")
                    .filter((line) => line.trim() !== "")
                    .map((line, idx) => (
                      <p key={idx}>{line.trim()}</p>
                    ))}
                </div>
              </div>
            )}

            {/* --------- CÂU HỎI --------- */}
            {data.mode !== "instruct_only" && item.type === "quiz" && (
              <div>
                <h2>Câu hỏi</h2>
                <p>{item.question}</p>
                <div className="answers">
                  {item.answers.map((opt, idx) => (
                    <button
                      type="button"
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

            {/* --------- CHỈNH SỬA --------- */}
            {data.mode !== "instruct_only" && item.type === "answer" && (
              <div>
                <h2>Chỉnh sửa đúng</h2>
                <pre>{item.value}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="popup-footer">
          {currentIndex < sequence.length - 1 ? (
            <button type="button" className="btn-next" onClick={handleNext} aria-label="Tiếp theo">
              <FaForward />
            </button>
          ) : (
            <button type="button" className="btn-finish" onClick={onClose}>
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
