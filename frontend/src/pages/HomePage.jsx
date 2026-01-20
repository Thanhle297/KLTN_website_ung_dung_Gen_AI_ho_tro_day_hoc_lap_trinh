import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCourses from "../hook/useCourses";
import CourseCard from "../components/CourseCard";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/HomePage.scss";

export default function HomePage() {
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("fullname");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

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
    `${process.env.REACT_APP_API_URL}/api/courses/my-courses`,
    fallbackCourses
  );

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..." />;

  return (
    <div className="homepage">
      {/* Welcome & Intro Section */}
      <section className="homepage__intro-section">
        <div className="homepage__welcome">
          <h1>Chào mừng trở lại, {userName}! 👋</h1>
          <p>
            "Hành trình vạn dặm bắt đầu từ một bước chân." – Hãy tiếp tục đam mê
            của bạn ngay hôm nay.
          </p>
        </div>
      </section>

      {/* My Courses Grid */}
      <section className="homepage__courses-section">
        <div className="section-header">
          <h2>Khóa học của tôi</h2>
          {/* <a href="/courses" className="view-all">Xem tất cả</a> */}
        </div>

        <div className="homepage__grid">
          {courses.map((course) => (
            <CourseCard key={course.courseId || course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
