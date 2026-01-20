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
      <div className="courses-ui__header">
        <h1 className="courses-ui__title">Khoá học của tôi</h1>
        <p className="courses-ui__subtitle">
          Tiếp tục hành trình chinh phục kiến thức của bạn
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="courses-ui__empty">
          <div className="courses-ui__empty-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 6.00018V18.0002M12 6.00018C12 6.00018 16 3.00018 20 6.00018M12 6.00018C12 6.00018 8 3.00018 4 6.00018M12 18.0002C12 18.0002 16 15.0002 20 18.0002M12 18.0002C12 18.0002 8 15.0002 4 18.0002M20 6.00018V18.0002M20 6.00018C20 6.00018 18 8 18 11M4 6.00018V18.0002M4 6.00018C4 6.00018 6 8 6 11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3>Chưa có khóa học nào</h3>
          <p>
            Hiện tại bạn chưa được phân công vào lớp học nào.
            <br />
            Vui lòng liên hệ giáo viên hoặc quản trị viên để được hỗ trợ.
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
