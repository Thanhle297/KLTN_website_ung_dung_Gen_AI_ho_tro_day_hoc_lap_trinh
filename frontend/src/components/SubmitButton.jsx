import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../styles/SubmitButton.scss";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane } from "react-icons/fa";

export default function SubmitButton({
  userId,
  lessonId,
  courseId,
  editorStates,
}) {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

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

      await fetch(`${process.env.REACT_APP_API_URL}/api/temp/clear`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, lessonId }),
      });

      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error("❌ Lỗi:", error);
    } finally {
      setLoading(false);
      setShowPopup(false);
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
          document.body
        )}
    </>
  );
}
