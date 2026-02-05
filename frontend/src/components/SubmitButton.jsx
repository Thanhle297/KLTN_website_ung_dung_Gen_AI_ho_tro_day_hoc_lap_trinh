import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../styles/SubmitButton.scss";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

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
            />
            <div className="popup-card">
              <div className="popup-header">
                <h3>Xác nhận nộp bài?</h3>
                <p>
                  Hệ thống sẽ ghi nhận kết quả cuối cùng. Bạn không thể chỉnh
                  sửa sau khi nộp.
                </p>
              </div>
              <div className="popup-actions">
                <button
                  onClick={() => setShowPopup(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
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
            <div className="popup-card result-popup">
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
                <h3>Kết quả nộp bài</h3>
                {/* Thông tin điểm */}
                <div className="score-info">
                  <div className="score-detail">
                    <strong>
                      {result.correct}/{result.total}
                    </strong>{" "}
                    câu đúng
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
                <button onClick={handleViewDetail} className="btn-primary">
                  Xem lại chi tiết
                </button>
                <button onClick={handleGoToCourse} className="btn-secondary">
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
