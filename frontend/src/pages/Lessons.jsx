// src/pages/Lessons.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Lessons.scss";

import SubmissionHistoryModal from "../components/SubmissionHistoryModal";

export default function Lessons() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [closing, setClosing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subLessons, setSubLessons] = useState({});
  const [subProgress, setSubProgress] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null); // ✅ State cho modal lịch sử

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // ... (giữ nguyên useEffect và các hàm fetch)
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/courses/my-courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        const myCourses = await res.json();
        const hasAccess = myCourses.some(
          (course) => course.courseId === classId
        );

        if (!hasAccess) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        fetchLessons();
      } catch (err) {
        console.error("❌ Lỗi kiểm tra quyền:", err);
        setAccessDenied(true);
        setLoading(false);
      }
    };

    checkAccess();
  }, [classId, token]);

  const fetchLessons = () => {
    fetch(`${process.env.REACT_APP_API_URL}/api/lessons/course/${classId}`)
      .then((res) => res.json())
      .then((data) => setLessons(data))
      .catch((err) => console.error("❌ Lỗi tải bài học:", err))
      .finally(() => setLoading(false));
  };

  const fetchSublessonProgress = async (subLessonId) => {
    if (!userId) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/progress/sublesson/${userId}/${subLessonId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setSubProgress((prev) => ({
        ...prev,
        [subLessonId]: {
          progress: data.progress ?? 0,
          completed: !!data.completed,
        },
      }));
    } catch (err) {
      console.error("❌ Lỗi tải tiến độ subLesson:", err);
    }
  };

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
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/lessons/detail/${lessonId}`
        );
        const data = await res.json();
        if (data.subLessons) {
          setSubLessons((prev) => ({ ...prev, [lessonId]: data.subLessons }));
          data.subLessons.forEach((sub) =>
            fetchSublessonProgress(sub.lessonId)
          );
        }
      } catch (err) {
        console.error("❌ Lỗi tải bài con:", err);
      }
    } else {
      subLessons[lessonId].forEach((sub) =>
        fetchSublessonProgress(sub.lessonId)
      );
    }
  };

  if (loading) return <p>Đang tải danh sách bài học...</p>;

  if (accessDenied) {
    return (
      <div
        className="lessons-list"
        style={{ textAlign: "center", padding: "3rem" }}
      >
        <h1 style={{ color: "#e53e3e", marginBottom: "1rem" }}>
          🚫 Không có quyền truy cập
        </h1>
        <p
          style={{ fontSize: "1.1rem", color: "#666", marginBottom: "1.5rem" }}
        >
          Bạn chưa được phân bổ vào khóa học này.
        </p>
        <p style={{ fontSize: "0.9rem", color: "#999" }}>
          Vui lòng liên hệ giáo viên để được thêm vào khóa học.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "2rem",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="lessons-list">
      <h1 className="lessons-list__title">Danh sách bài học - Lớp {classId}</h1>

      {lessons
        .filter((lesson) => lesson.display !== false)
        .map((lesson) => {
          const isExpanded = expanded === lesson.lessonId;
          const isClosing = closing === lesson.lessonId;
          const subList = subLessons[lesson.lessonId] || [];

          return (
            <div
              key={lesson.lessonId}
              className={`lesson-item ${
                isExpanded ? "expanded" : isClosing ? "closing" : ""
              }`}
            >
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

              {(isExpanded || isClosing) && subList.length > 0 && (
                <div
                  className={`sub-lessons ${
                    isExpanded ? "opening" : "closing"
                  }`}
                >
                  {subList
                    .filter((sub) => sub.display !== false)
                    .map((sub, index) => {
                      const prog = subProgress[sub.lessonId] || {
                        progress: 0,
                        completed: false,
                      };

                      return (
                        <div
                          key={sub.lessonId}
                          className="sub-lesson-wrapper"
                          style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                        >
                          <div className="sub-lesson">
                            <div className="sub-lesson__info">
                              <h4>
                                {sub.displayId ? `${sub.displayId}: ` : ""}
                                {sub.title}
                              </h4>
                              <p>{sub.description}</p>
                              <p>Số câu hỏi: {sub.questionCount ?? 0}</p>
                            </div>

                            <div className="sub-lesson__actions">
                              <button
                                className="btn-do"
                                onClick={() =>
                                  navigate(
                                    sub.mode === "simple"
                                      ? `/lesson-simple/${sub.lessonId}`
                                      : `/lesson/${sub.lessonId}`
                                  )
                                }
                              >
                                {prog.progress > 0 ? "Làm lại" : "Làm bài"}
                              </button>

                              {/* ✅ Nút xem lịch sử - Chỉ hiển thị khi đã làm bài */}
                              {prog.progress > 0 && (
                                <button
                                  className="btn-history"
                                  onClick={() => setHistoryTarget(sub.lessonId)}
                                  style={{
                                    marginLeft: "0.5rem",
                                    padding: "0.5rem 1rem",
                                    background: "#f3f4f6",
                                    color: "#374151",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                  }}
                                >
                                  Lịch sử
                                </button>
                              )}

                              <button
                                className={`btn-status ${
                                  prog.completed ? "done" : "pending"
                                }`}
                                disabled
                              >
                                {prog.completed
                                  ? "Đã hoàn thành"
                                  : "Chưa hoàn thành"}
                              </button>
                            </div>
                          </div>

                          <div className="progress-section">
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${
                                  prog.progress >= 90 ? "excellent" : ""
                                }`}
                                style={{ width: `${prog.progress}%` }}
                              />
                            </div>
                            <div className="progress-label">
                              <div className="rating">
                                {prog.progress < 50 && (
                                  <span className="face">😞</span>
                                )}

                                {prog.progress >= 50 && prog.progress < 70 && (
                                  <span>⭐</span>
                                )}

                                {prog.progress >= 70 && prog.progress < 90 && (
                                  <>
                                    <span>⭐</span>
                                    <span>⭐</span>
                                  </>
                                )}

                                {prog.progress >= 90 && (
                                  <>
                                    <span>⭐</span>
                                    <span>⭐</span>
                                    <span>⭐</span>
                                  </>
                                )}
                              </div>

                              <span className="percent">{prog.progress}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}

      {/* ✅ MODAL LỊCH SỬ */}
      {historyTarget && (
        <SubmissionHistoryModal
          userId={userId}
          subLessonId={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
