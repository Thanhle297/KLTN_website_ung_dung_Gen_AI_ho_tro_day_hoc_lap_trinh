// =============================================================================
// AdminDashboard.jsx
// Container chính cho khu vực quản trị. Sau khi refactor (Giai đoạn 2),
// file này chỉ còn nhiệm vụ định tuyến (nested <Routes>) - toàn bộ layout
// (AppBar / Sidebar / Breadcrumbs) đã chuyển sang <AdminLayout>.
// =============================================================================

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../../components/admin/layout/AdminLayout";

// Page modules
import AdminHome from "./AdminHome";
import UsersCRUD from "./UsersCRUD";
import CoursesCRUD from "./CoursesCRUD";
import LessonsCRUD from "./LessonsCRUD";
import SubLessonsCRUD from "./SubLessonsCRUD";
import QuestionsCRUD from "./QuestionsCRUD";
import QuestionBank from "./QuestionBank";
import EnrollmentsCRUD from "./EnrollmentsCRUD";
import CourseReportPage from "./ReportPage";
import LoginTrackingPage from "./LoginTrackingPage";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<UsersCRUD />} />
        <Route path="question-bank" element={<QuestionBank />} />
        <Route path="courses" element={<CoursesCRUD />} />
        <Route path="course-report/:courseId" element={<CourseReportPage />} />
        <Route path="lessons" element={<LessonsCRUD />} />
        <Route path="sub-lessons" element={<SubLessonsCRUD />} />
        <Route path="questions" element={<QuestionsCRUD />} />
        <Route path="enrollments" element={<EnrollmentsCRUD />} />
        <Route path="login-tracking" element={<LoginTrackingPage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </AdminLayout>
  );
}
