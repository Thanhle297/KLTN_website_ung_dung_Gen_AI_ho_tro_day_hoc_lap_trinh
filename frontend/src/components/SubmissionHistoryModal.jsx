import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import "../styles/SubmissionHistoryModal.scss";
import { FaHistory, FaEye, FaTimes } from "react-icons/fa";

export default function SubmissionHistoryModal({
  userId,
  subLessonId,
  onClose,
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [userId, subLessonId]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/submit/history/${userId}/${subLessonId}`
      );
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử:", err);
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="history-modal-overlay" onClick={onClose}>
      <div
        className="history-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="history-modal-header">
          <h3>
            <FaHistory /> Lịch sử làm bài
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="history-modal-body">
          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có lượt làm bài nào.</p>
            </div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Điểm số</th>
                  <th>Kết quả</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                    <td>
                      {item.correct}/{item.total}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.progress >= item.requiredProgress
                            ? "pass"
                            : "fail"
                        }`}
                      >
                        {item.progress}%
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-review"
                        onClick={() => navigate(`/review/${item._id}`)}
                      >
                        <FaEye /> Xem lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
