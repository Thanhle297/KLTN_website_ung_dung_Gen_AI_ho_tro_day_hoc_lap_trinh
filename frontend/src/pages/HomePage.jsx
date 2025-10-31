import React from "react";
import useCourses from "../hook/useCourses";
import CourseCard from "../components/CourseCard";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/HomePage.scss";

export default function HomePage() {
  const fallbackCourses = [
    {
      id: 10,
      name: "Khóa học Tin học lớp 10",
      lessons: ["HTML", "CSS"],
      tag: "CƠ BẢN",
      img: "https://cdn-icons-png.flaticon.com/512/201/201623.png",
    },
    {
      id: 11,
      name: "Khóa học Tin học lớp 11",
      lessons: ["Hàm", "Mảng"],
      tag: "TRUNG CẤP",
      img: "https://cdn-icons-png.flaticon.com/512/906/906343.png",
    },
  ];

  const { courses, loading } = useCourses(
    "http://103.90.224.183:3001/api/courses",
    fallbackCourses
  );

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..."/>;

  return (
    <div className="homepage">
      <section className="homepage__intro">
        <h1>Chào mừng bạn đến với hệ thống học lập trình 🎓</h1>
      </section>

      <section className="homepage__courses">
        <h2>Khóa học của bạn</h2>
        <div className="homepage__grid">
          {courses.map((course) => (
            <CourseCard key={course.courseId || course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
