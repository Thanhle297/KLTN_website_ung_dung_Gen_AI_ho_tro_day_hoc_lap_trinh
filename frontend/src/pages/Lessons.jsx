// src/pages/Lessons.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Lessons.scss";

export default function Lessons() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [closing, setClosing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subLessons, setSubLessons] = useState({});
  const [subProgress, setSubProgress] = useState({}); // { subLessonId: { progress, completed } }

  const userId = localStorage.getItem("userId");

  // Lấy danh sách lesson
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/lessons/course/${classId}`)
      .then((res) => res.json())
      .then((data) => setLessons(data))
      .catch((err) => console.error("❌ Lỗi tải bài học:", err))
      .finally(() => setLoading(false));
  }, [classId]);

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
                                Làm bài
                              </button>

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

                          {/* PROGRESS — NGOÀI CARD */}
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
    </div>
  );
}
