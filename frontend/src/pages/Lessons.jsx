// src/pages/Lessons.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Lessons.scss";

export default function Lessons() {
  const { classId } = useParams(); // courseId
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [expanded, setExpanded] = useState(null); // bài đang mở
  const [closing, setClosing] = useState(null); // bài đang đóng
  const [loading, setLoading] = useState(true);
  const [subLessons, setSubLessons] = useState({});

  // Lấy danh sách bài học
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/lessons/course/${classId}`)
      .then((res) => res.json())
      .then((data) => setLessons(data))
      .catch((err) => console.error("❌ Lỗi tải bài học:", err))
      .finally(() => setLoading(false));
  }, [classId]);

  // Xử lý mở/đóng
  const handleExpand = async (lessonId) => {
    if (expanded === lessonId) {
      setClosing(lessonId);
      setExpanded(null);
      setTimeout(() => setClosing(null), 600);
      return;
    }

    setExpanded(lessonId);
    setClosing(null);

    if (!subLessons[lessonId]) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/lessons/detail/${lessonId}`);
        const data = await res.json();
        if (data.subLessons) {
          setSubLessons((prev) => ({ ...prev, [lessonId]: data.subLessons }));
        }
      } catch (err) {
        console.error("❌ Lỗi tải bài con:", err);
      }
    }
  };

  if (loading) return <p>Đang tải danh sách bài học...</p>;

  return (
    <div className="lessons-list">
      <h1 className="lessons-list__title">Danh sách bài học - Lớp {classId}</h1>

      {lessons
        .filter((lesson) => lesson.display !== false) // ẩn bài nếu display=false
        .map((lesson) => {
          const isExpanded = expanded === lesson.lessonId;
          const isClosing = closing === lesson.lessonId;

          return (
            <div
              key={lesson.lessonId}
              className={`lesson-item ${
                isExpanded ? "expanded" : isClosing ? "closing" : ""
              }`}
            >
              {/* Hàng trên: tiêu đề và nút */}
              <div className="lesson-item__top">
                <div
                  className="lesson-item__info"
                  onClick={() => handleExpand(lesson.lessonId)}
                >
                  <h3>{lesson.title}</h3>
                  <p>{lesson.description}</p>
                </div>

                <button
                  className="lesson-item__btn"
                  onClick={() => handleExpand(lesson.lessonId)}
                >
                  {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                </button>
              </div>

              {/* Các bài con hiển thị phía dưới */}
              {(isExpanded || isClosing) && subLessons[lesson.lessonId] && (
                <div
                  className={`sub-lessons ${
                    isExpanded ? "opening" : "closing"
                  }`}
                >
                  {subLessons[lesson.lessonId]
                    .filter((sub) => sub.display !== false) // ẩn sub nếu display=false
                    .map((sub, index) => (
                      <div
                        key={sub.lessonId}
                        className="sub-lesson"
                        style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                      >
                        <div className="sub-lesson__info">
                          <h4>
                            {sub.displayId ? `${sub.displayId}: ` : ""}
                            {sub.title}
                          </h4>
                          <p>{sub.description}</p>
                          <p>Số câu hỏi: {sub.questionCount ?? 0}</p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(
                              sub.mode === "simple"
                                ? `/lesson-simple/${sub.lessonId}`
                                : `/lesson/${sub.lessonId}`
                            )
                          }
                        >
                          Làm bài
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
