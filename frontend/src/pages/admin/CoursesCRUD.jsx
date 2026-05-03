import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, useTheme } from "@mui/material";
import { School, Add } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";
import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import CoursesTable from "../../components/admin/courses/CoursesTable";
import CourseFormDialog from "../../components/admin/courses/CourseFormDialog";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";
import CourseUsersDialog from "../../components/admin/courses/CourseUsersDialog";
import CourseTeachersDialog from "../../components/admin/courses/CourseTeachersDialog";
import { gradientButtonSx } from "../../styles/adminTokens";

export default function CoursesCRUD() {
  const api = useAdminAPI();
  const navigate = useNavigate();
  const theme = useTheme();
  const notify = useNotify();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [openUsersDialog, setOpenUsersDialog] = useState(false);
  const [managingCourse, setManagingCourse] = useState(null);

  const [openTeachersDialog, setOpenTeachersDialog] = useState(false);
  const [managingTeachersCourse, setManagingTeachersCourse] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ==================== LOAD ==================== */
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      setCourses(res.data);
    } catch (err) {
      notify.error("Lỗi tải khóa học");
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  /* ==================== FORM ==================== */
  const handleAddClick = useCallback(() => {
    setEditing(null);
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((course) => {
    setEditing(course);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  /* ==================== SAVE ==================== */
  const handleSave = useCallback(
    async (formData) => {
      try {
        if (!formData.title) {
          notify.warning("title là bắt buộc");
          return;
        }

        if (editing) {
          await api.updateCourse(editing.courseId, formData);
          notify.success("Cập nhật khóa học thành công");
        } else {
          await api.createCourse(formData);
          notify.success("Thêm khóa học thành công");
        }

        setOpenDialog(false);
        loadCourses();
      } catch {
        notify.error("Lỗi lưu khóa học");
      }
    },
    [editing, api, notify, loadCourses]
  );

  // ✅ Thêm handlers cho CourseUsersDialog
  const handleManageUsers = useCallback((course) => {
    setManagingCourse(course);
    setOpenUsersDialog(true);
  }, []);
  const handleCloseUsersDialog = useCallback(() => {
    setOpenUsersDialog(false);
    setManagingCourse(null);
  }, []);

  // ✅ Thêm handlers cho CourseTeachersDialog
  const handleManageTeachers = useCallback((course) => {
    setManagingTeachersCourse(course);
    setOpenTeachersDialog(true);
  }, []);
  const handleCloseTeachersDialog = useCallback(() => {
    setOpenTeachersDialog(false);
    setManagingTeachersCourse(null);
  }, []);

  // Handler cho View Report - navigate đến page mới
  const handleViewReport = useCallback(
    (course) => {
      navigate(`/admin/course-report/${course.courseId}`);
    },
    [navigate]
  );

  /* ==================== DELETE ==================== */
  const handleDeleteClick = useCallback((course) => {
    setDeleteTarget(course);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await api.deleteCourse(deleteTarget.courseId);
      notify.success("Xóa thành công");
      setDeleteTarget(null);
      loadCourses();
    } catch {
      notify.error("Lỗi xóa khóa học");
    }
  }, [deleteTarget, api, notify, loadCourses]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ==================== RENDER ==================== */
  return (
    <AdminPageWrapper>
      <AdminPageHeader
        icon={<School />}
        title="Quản lý Khóa học"
        subtitle={`Tổng cộng: ${courses.length} khóa học`}
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddClick}
            sx={gradientButtonSx(theme)}
          >
            Thêm khóa học
          </Button>
        }
      />

      <CoursesTable
        courses={courses}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onManageUsers={handleManageUsers}
        onManageTeachers={handleManageTeachers}
        onViewReport={handleViewReport}
      />

      <CourseFormDialog
        open={openDialog}
        editing={editing}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title || ""}
        itemType="khóa học này"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <CourseUsersDialog
        open={openUsersDialog}
        course={managingCourse}
        onClose={handleCloseUsersDialog}
        onSave={() => {
          notify.success("Cập nhật học sinh thành công");
          loadCourses();
        }}
        api={api}
      />

      <CourseTeachersDialog
        open={openTeachersDialog}
        course={managingTeachersCourse}
        onClose={handleCloseTeachersDialog}
        onTeachersChanged={() => {
          notify.success("Cập nhật giáo viên thành công");
        }}
      />
    </AdminPageWrapper>
  );
}
