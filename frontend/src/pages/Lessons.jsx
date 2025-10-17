import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Lessons.scss";

export default function Lessons() {
  const { classId } = useParams();   // = courseId bên backend
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/lessons/${classId}`)
      .then((res) => res.json())
      .then((data) => setLessons(data))
      .catch((err) => console.error("❌ Lỗi tải bài học:", err))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <p>Đang tải danh sách bài học...</p>;

  return (
    <div className="lessons-list">
      <h1 className="lessons-list__title">Danh sách bài học - Lớp {classId}</h1>

      {lessons.map((lesson, i) => (
        <div key={i} className="lesson-item">
          <div className="lesson-item__info">
            <h3>{lesson.title}</h3>
            <p>{lesson.description}</p>
          </div>

          <button
            className="lesson-item__btn"
            onClick={() => navigate(`/lesson/${lesson.lessonId}`)}
          >
            Làm bài
          </button>
        </div>
      ))}
    </div>
  );
}
