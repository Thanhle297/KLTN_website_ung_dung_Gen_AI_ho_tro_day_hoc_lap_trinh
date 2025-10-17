import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CourseCard.scss";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const id = course.courseId || course.id;

  return (
    <div className="course-card">
      <div className="course-card__image">
        <img src={course.image || course.img} alt={course.title || course.name} />
        {course.tag && <span className="course-card__tag">{course.tag}</span>}
      </div>

      <div className="course-card__body">
        <h3>{course.title || course.name}</h3>
        <p>{course.description || `${course.lessons?.length || 0} bài học`}</p>
        <button
          onClick={() => navigate(`/course/${id}`)}
          className="course-card__btn"
        >
          Vào học
        </button>
      </div>
    </div>
  );
}
