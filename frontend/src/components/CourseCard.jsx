import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CourseCard.scss";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const id = course.courseId || course.id;

  return (
    <div
      className="course-card"
      onClick={() => navigate(`/course/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate(`/course/${id}`);
        }
      }}
    >
      <div className="course-card__image">
        <img
          src={course.image || course.img}
          alt={course.title || course.name}
        />
        {course.tag && <span className="course-card__tag">{course.tag}</span>}
      </div>

      <div className="course-card__body">
        <h3>{course.title || course.name}</h3>
        <p>{course.description || `${course.lessons?.length || 0} bài học`}</p>
        <button
          className="course-card__btn"
          tabIndex={-1} // Prevent double tab stop since card is focusable
        >
          Vào học
        </button>
      </div>
    </div>
  );
}
