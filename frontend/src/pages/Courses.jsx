import React from "react";
import useCourses from "../hook/useCourses";
import CourseCard from "../components/CourseCard";
import "../styles/Courses.scss";

export default function Courses() {
  const { courses, loading } = useCourses(
    process.env.REACT_APP_API_URL + "/api/courses"
  );

  if (loading) return <p>Đang tải khóa học...</p>;

  return (
    <div className="courses-ui">
      <h1 className="courses-ui__title">Danh sách khóa học</h1>
      <div className="courses-ui__grid">
        {courses.map((course) => (
          <CourseCard key={course.courseId || course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
