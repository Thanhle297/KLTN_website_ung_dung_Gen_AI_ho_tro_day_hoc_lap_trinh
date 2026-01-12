import React from "react";
import useCourses from "../hook/useCourses";
import CourseCard from "../components/CourseCard";
import "../styles/Courses.scss";

export default function Courses() {
  // ✅ Thay đổi endpoint để chỉ lấy courses được phân vào
  const { courses, loading } = useCourses(
    process.env.REACT_APP_API_URL + "/api/courses/my-courses"
  );

  if (loading) return <p>Đang tải khóa học...</p>;

  return (
    <div className="courses-ui">
      <h1 className="courses-ui__title">Danh sách khóa học</h1>

      {courses.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            fontSize: "1.1rem",
            color: "#666",
          }}
        >
          <p>📚 Bạn chưa được phân bổ vào khóa học nào.</p>
          <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
            Vui lòng liên hệ giáo viên để được thêm vào khóa học.
          </p>
        </div>
      ) : (
        <div className="courses-ui__grid">
          {courses.map((course) => (
            <CourseCard key={course.courseId || course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
