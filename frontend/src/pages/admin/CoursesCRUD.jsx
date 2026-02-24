import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Snackbar, Alert } from "@mui/material";

import useAdminAPI from "../../hook/useAdminAPI";
import CoursesHeader from "../../components/admin/courses/CoursesHeader";
import CoursesTable from "../../components/admin/courses/CoursesTable";
import CourseFormDialog from "../../components/admin/courses/CourseFormDialog";
import DeleteConfirmDialog from "../../components/admin/courses/DeleteConfirmDialog";
import CourseUsersDialog from "../../components/admin/courses/CourseUsersDialog";
import CourseTeachersDialog from "../../components/admin/courses/CourseTeachersDialog";

export default function CoursesCRUD() {
  const api = useAdminAPI();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [openUsersDialog, setOpenUsersDialog] = useState(false);
  const [managingCourse, setManagingCourse] = useState(null);

  const [openTeachersDialog, setOpenTeachersDialog] = useState(false);
  const [managingTeachersCourse, setManagingTeachersCourse] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = useCallback((msg, severity = "success") => {
    setSnack({ open: true, message: msg, severity });
  }, []);

  const handleCloseSnack = useCallback(() => {
    setSnack((prev) => ({ ...prev, open: false }));
  }, []);

  /* ==================== LOAD ==================== */
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      setCourses(res.data);
    } catch (err) {
      showMessage("Lỗi tải khóa học", "error");
    } finally {
      setLoading(false);
    }
  }, [api, showMessage]);

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
          showMessage("title là bắt buộc", "warning");
          return;
        }

        if (editing) {
          await api.updateCourse(editing.courseId, formData);
          showMessage("Cập nhật khóa học thành công");
        } else {
          await api.createCourse(formData);
          showMessage("Thêm khóa học thành công");
        }

        setOpenDialog(false);
        loadCourses();
      } catch {
        showMessage("Lỗi lưu khóa học", "error");
      }
    },
    [editing, api, showMessage, loadCourses]
  );

  const handleCloseDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);
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
      showMessage("Xóa thành công");
      setDeleteTarget(null);
      loadCourses();
    } catch {
      showMessage("Lỗi xóa khóa học", "error");
    }
  }, [deleteTarget, api, showMessage, loadCourses]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /* ==================== RENDER ==================== */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #42A5F5 0%, #2196F3 50%, #1976D2 100%)",
        p: 3,
      }}
    >
      <CoursesHeader onAddClick={handleAddClick} />

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
        courseName={deleteTarget?.title || ""}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <CourseUsersDialog
        open={openUsersDialog}
        course={managingCourse}
        onClose={handleCloseUsersDialog}
        onSave={() => {
          showMessage("Cập nhật học sinh thành công");
          loadCourses();
        }}
        api={api}
      />

      <CourseTeachersDialog
        open={openTeachersDialog}
        course={managingTeachersCourse}
        onClose={handleCloseTeachersDialog}
        onTeachersChanged={() => {
          showMessage("Cập nhật giáo viên thành công");
        }}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnack}
          severity={snack.severity}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
