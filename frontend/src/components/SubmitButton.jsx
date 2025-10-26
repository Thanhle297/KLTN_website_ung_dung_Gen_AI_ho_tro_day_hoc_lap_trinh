import React, { useState } from "react";
import "../styles/SubmitButton.scss";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane } from "react-icons/fa";

export default function SubmitButton({ userId, lessonId, courseId }) {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // ✅ Gọi API xóa dữ liệu tạm
      await fetch("http://localhost:3001/api/temp/clear", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, lessonId }),
      });

      // ✅ Sau khi xóa thành công -> chuyển hướng về trang bài học
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error("❌ Lỗi khi nộp bài:", error);
      alert("Có lỗi khi nộp bài. Vui lòng thử lại.");
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

      {/* Popup xác nhận */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Xác nhận nộp bài?</h3>
            <p>
              Bạn có chắc muốn nộp bài không? Sau khi nộp sẽ không thể chỉnh
              sửa.
            </p>
            <div className="actions">
              <button onClick={handleSubmit} className="confirm">
                Có
              </button>
              <button onClick={() => setShowPopup(false)} className="cancel">
                Không
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
