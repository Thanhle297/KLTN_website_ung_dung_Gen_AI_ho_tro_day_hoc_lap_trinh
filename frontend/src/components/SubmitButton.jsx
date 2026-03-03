import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import "../styles/SubmitButton.scss";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import confetti from "canvas-confetti";

export default function SubmitButton({
  userId,
  lessonId,
  courseId,
  editorStates,
}) {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showResultPopup, setShowResultPopup] = useState(false);
  const [result, setResult] = useState(null);

  // Hiệu ứng pháo hoa chúc mừng khi nộp bài thành công
  const fireConfetti = useCallback((isCompleted) => {
    const zIndex = 9999; // Đảm bảo pháo hoa hiển thị trên popup overlay

    if (isCompleted) {
      // Pháo hoa hoành tráng khi đạt yêu cầu - bắn từ hai bên
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        // Bắn từ bên trái
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#4fc3f7", "#81c784", "#fff176", "#ff8a65", "#ba68c8"],
          zIndex,
        });
        // Bắn từ bên phải
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#4fc3f7", "#81c784", "#fff176", "#ff8a65", "#ba68c8"],
          zIndex,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Bắn thêm một đợt lớn ở giữa
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { x: 0.5, y: 0.4 },
          colors: ["#4fc3f7", "#81c784", "#fff176", "#ff8a65", "#ba68c8"],
          zIndex,
        });
      }, 300);
    } else {
      // Bắn nhẹ nhàng khi chưa đạt - vẫn khích lệ học sinh
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#90caf9", "#b0bec5"],
        zIndex,
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (!userId || !lessonId) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, lessonId, courseId, editorStates }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setResult(data);
      setShowPopup(false);
      setShowResultPopup(true);
      // Bắn pháo hoa chúc mừng
      fireConfetti(data.completed);

      await fetch(`${process.env.REACT_APP_API_URL}/api/temp/clear`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, lessonId }),
      });
    } catch (error) {
      console.error("❌ Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };
  // chuyển về lessons
  const handleGoToCourse = () => {
    setShowResultPopup(false);
    navigate(`/course/${courseId}`);
  };
  // chuyển tới review page
  const handleViewDetail = () => {
    if (result?.submissionId) {
      setShowResultPopup(false);
      navigate(`/review/${result.submissionId}`);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`submit-btn ${loading ? "disabled" : ""}`}
        onClick={() => setShowPopup(true)}
        disabled={loading}
      >
        <FaPaperPlane className="icon" />
        {loading ? "Đang xử lý..." : "Nộp bài"}
      </button>

      {/* Portal đảm bảo popup nằm ngoài mọi thẻ div cha bị giới hạn chiều cao */}
      {showPopup &&
        ReactDOM.createPortal(
          <div className="modern-popup-root">
            <div
              className="popup-overlay"
              onClick={() => setShowPopup(false)}
              onKeyDown={(e) => { if (e.key === "Escape") setShowPopup(false); }}
            />
            <div className="popup-card" role="dialog" aria-modal="true" aria-labelledby="confirm-popup-title">
              <div className="popup-header">
                <h3 id="confirm-popup-title">Xác nhận nộp bài?</h3>
                <p>
                  Hệ thống sẽ ghi nhận kết quả cuối cùng. Bạn không thể chỉnh
                  sửa sau khi nộp.
                </p>
              </div>
              <div className="popup-actions">
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Đang nộp..." : "Xác nhận nộp"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* Popup kết quả điểm số */}
      {showResultPopup &&
        result &&
        ReactDOM.createPortal(
          <div className="modern-popup-root">
            <div className="popup-overlay" />
            <div className="popup-card result-popup" role="dialog" aria-modal="true" aria-labelledby="result-popup-title">
              <div className="popup-header">
                {/* Icon Đạt/Chưa đạt */}
                <div
                  className={`result-icon ${result.completed ? "pass" : "fail"}`}
                >
                  {result.completed ? (
                    <FaCheckCircle className="icon-pass" />
                  ) : (
                    <FaTimesCircle className="icon-fail" />
                  )}
                </div>
                {/* Tiêu đề */}
                <h3 id="result-popup-title">Kết quả nộp bài</h3>
                {/* Thông tin điểm */}
                <div className="score-info">
                  <div className="score-detail">
                    <strong>
                      {result.correct}/{result.total}
                    </strong>{" "}
                    câu đúng
                    {result.partial > 0 && (
                      <span className="partial-count">
                        {" "}· <strong>{result.partial}</strong> đúng một phần
                      </span>
                    )}
                  </div>
                  <div className="score-percentage">
                    Điểm số: <strong>{result.progress}%</strong>
                  </div>
                  <span
                    className={`badge ${result.completed ? "pass" : "fail"}`}
                  >
                    {result.completed
                      ? `✓ Đạt yêu cầu (≥${result.requiredProgress}%)`
                      : `✗ Chưa đạt (cần ≥${result.requiredProgress}%)`}
                  </span>
                </div>
              </div>
              <div className="popup-actions">
                <button type="button" onClick={handleViewDetail} className="btn-primary">
                  Xem lại chi tiết
                </button>
                <button type="button" onClick={handleGoToCourse} className="btn-secondary">
                  Về khóa học
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
