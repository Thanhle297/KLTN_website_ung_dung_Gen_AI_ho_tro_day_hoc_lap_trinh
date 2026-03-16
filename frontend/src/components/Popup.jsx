// components/Popup.jsx
import React, { useState, useEffect } from "react";
import { FaTimes, FaForward } from "react-icons/fa";
import charInstruct from "../IMG/anh1.png";
import charCorrect from "../IMG/anh2.png";
import charWrong from "../IMG/anh3.png";
import charQuiz from "../IMG/anh4.png";
import correctSound from "../sounds/correct.mp3";
import wrongSound from "../sounds/wrong.mp3";
import TypewriterMarkdown from "./TypewriterMarkdown";
import "../styles/Popup.scss";

// Câu động viên khi có hướng dẫn chi tiết từ AI (difficulty 0, 1)
const encourageWithGuide = [
  "Em đã hoàn thành phần hướng dẫn rồi! Hãy thử áp dụng những gợi ý trên để sửa lại bài nhé. Cố lên, em làm được!",
  "Tuyệt vời! Em đã xem hết hướng dẫn. Giờ hãy quay lại code và thử sửa theo các bước gợi ý nhé. Thầy tin em!",
  "Em rất chăm chỉ! Hãy bình tĩnh đọc lại đề bài, áp dụng hướng dẫn và thử lại. Mỗi lần sửa lỗi là một lần em giỏi hơn!",
  "Giỏi lắm! Em đã nắm được hướng đi rồi đó. Hãy thử viết lại code theo gợi ý, đừng ngại sai vì sai là để học!",
  "Phần hướng dẫn đã xong! Em hãy thử lại bài làm nhé. Nhớ rằng lập trình là luyện tập, càng thử nhiều càng giỏi!",
];

// Câu động viên khi không có hướng dẫn AI (difficulty 2 - tự lực)
const encourageNoGuide = [
  "Hãy đọc kỹ lại đề bài và kiểm tra từng dòng code của em nhé. Em tự làm được, cố lên!",
  "Đừng nản, hãy thử chạy lại chương trình và so sánh kết quả với yêu cầu đề bài. Em sẽ tìm ra lỗi thôi!",
  "Lập trình là thử và sai. Hãy bình tĩnh suy nghĩ lại cách giải, em hoàn toàn có thể tự sửa được!",
  "Hãy thử kiểm tra lại input, output và logic chương trình. Mỗi lần thử lại là một bước tiến!",
  "Em hãy tự tin thử lại nhé. Đọc lại đề, kiểm tra code từng bước, em sẽ tìm ra hướng giải quyết!",
];

function getRandomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function FETestPopup({ data, onClose }) {
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [shake, setShake] = useState(false);
  const [answered, setAnswered] = useState(null); // null | "correct" | "wrong"
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [processing, setProcessing] = useState(false); // Chặn bấm nút khi đang xử lý

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

    // Thêm màn hình động viên ở cuối - chọn câu phù hợp với mức độ hỗ trợ
    // Có hướng dẫn = có quiz hoặc có nhiều hơn 1 instruct (AI trả về chi tiết)
    const hasGuidance =
      seq.filter((s) => s.type === "quiz").length > 0 ||
      seq.filter((s) => s.type === "instruct").length > 1;
    const encourageMsg = hasGuidance
      ? getRandomFrom(encourageWithGuide)
      : getRandomFrom(encourageNoGuide);
    seq.push({ type: "encourage", value: encourageMsg });

    setSequence(seq);
    setCurrentIndex(0);
  }, [data]);

  // Reset trạng thái typewriter mỗi khi chuyển item
  useEffect(() => {
    setTypewriterDone(false);
  }, [currentIndex]);

  if (!data || !sequence.length) return null;

  const item = sequence[currentIndex];

  const handleNext = () => {
    // Chặn bấm liên tục khi đang xử lý (chống double-click)
    if (processing) return;

    if (item.type === "quiz") {
      // Phải chọn đáp án trước khi bấm tiếp
      if (selected === null) return;

      if (selected === item.correctIndex) {
        setProcessing(true);
        new Audio(correctSound).play();
        setAnswered("correct");
        // Delay để học sinh thấy ảnh thumbs up trước khi chuyển
        setTimeout(() => {
          setSelected(null);
          setAnswered(null);
          setProcessing(false);
          setCurrentIndex((i) => Math.min(i + 1, sequence.length - 1));
        }, 800);
      } else {
        setProcessing(true);
        new Audio(wrongSound).play();
        setAnswered("wrong");
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setAnswered(null);
          setSelected(null);
          setProcessing(false);
        }, 400);
      }
    } else {
      setSelected(null);
      setAnswered(null);
      setCurrentIndex((i) => Math.min(i + 1, sequence.length - 1));
    }
  };

  // Chọn ảnh nhân vật phù hợp với ngữ cảnh hiện tại
  const getCharacterImage = () => {
    if (item.type === "instruct") return charInstruct;
    if (item.type === "answer") return charInstruct;
    if (item.type === "encourage") return charCorrect;
    if (item.type === "quiz") {
      if (answered === "correct") return charCorrect;
      if (answered === "wrong") return charWrong;
      return charQuiz;
    }
    return charInstruct;
  };

  return (
    <div className="popup-overlay">
      <div
        className={`popup ${shake ? "shake" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Hướng dẫn AI"
      >
        <button
          type="button"
          className="popup-close"
          onClick={onClose}
          aria-label="Đóng"
        >
          <FaTimes />
        </button>

        <div className="popup-body">
          <div className="character">
            <img
              src={getCharacterImage()}
              alt="Gia sư"
              width={120}
              height={120}
              className="character-img"
            />
          </div>

          <div className="content">
            {/* --------- HƯỚNG DẪN --------- */}
            {item.type === "instruct" && (
              <div>
                <h2>Hướng dẫn</h2>
                <div className="instruct-block">
                  <TypewriterMarkdown
                    content={item.value}
                    speed={30}
                    onComplete={() => setTypewriterDone(true)}
                    emptyText="Không có hướng dẫn."
                  />
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

            {/* --------- ĐỘNG VIÊN KẾT THÚC --------- */}
            {item.type === "encourage" && (
              <div className="encourage-block">
                <h2>Hoàn thành!</h2>
                <p className="encourage-message">{item.value}</p>
              </div>
            )}
          </div>
        </div>

        <div className="popup-footer">
          {currentIndex < sequence.length - 1 ? (
            // Chỉ hiện nút Tiếp khi typewriter đã chạy xong (hoặc không phải instruct)
            // Và không đang xử lý (chống double-click)
            (item.type !== "instruct" || typewriterDone) && !processing && (
              <button
                type="button"
                className="btn-next"
                onClick={handleNext}
                aria-label="Tiếp theo"
              >
                <FaForward />
              </button>
            )
          ) : (
            // Nút Hoàn thành - chỉ hiện khi typewriter đã xong (hoặc không phải instruct)
            (item.type !== "instruct" || typewriterDone) && !processing && (
              <button type="button" className="btn-finish" onClick={onClose}>
                Hoàn thành
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
