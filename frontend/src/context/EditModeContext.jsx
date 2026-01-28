// src/context/EditModeContext.jsx
// Context quản lý chế độ chỉnh sửa (Edit Mode) cho trang Lessons
// Cho phép Teacher và Admin chỉnh sửa bài học, bài học con và câu hỏi

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import useAdminAPI from "../hook/useAdminAPI";

const EditModeContext = createContext({
  editMode: false,
  setEditMode: () => {},
  canEdit: false,
  userRole: null,
  loading: true,
});

/**
 * Provider cho EditMode context
 * @param {string} courseId - ID của khóa học hiện tại
 * @param {React.ReactNode} children - Component con
 */
export function EditModeProvider({ courseId, children }) {
  const api = useAdminAPI();

  const [editMode, setEditMode] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra quyền edit khi courseId thay đổi
  const checkEditPermission = useCallback(async () => {
    if (!courseId) {
      setCanEdit(false);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.canEditCourse(courseId);
      const { canEdit: hasPermission, role } = res.data;

      setCanEdit(hasPermission);
      setUserRole(role);

      // Nếu không có quyền, tắt edit mode
      if (!hasPermission) {
        setEditMode(false);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra quyền edit:", error);
      setCanEdit(false);
      setUserRole(null);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  }, [courseId, api]);

  useEffect(() => {
    checkEditPermission();
  }, [checkEditPermission]);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    if (canEdit) {
      setEditMode((prev) => !prev);
    }
  }, [canEdit]);

  const value = {
    editMode,
    setEditMode,
    toggleEditMode,
    canEdit,
    userRole,
    loading,
    courseId,
  };

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

/**
 * Hook để sử dụng EditMode context
 * @returns {Object} - { editMode, setEditMode, toggleEditMode, canEdit, userRole, loading, courseId }
 */
export function useEditMode() {
  const context = useContext(EditModeContext);

  if (!context) {
    throw new Error("useEditMode phải được sử dụng trong EditModeProvider");
  }

  return context;
}

export default EditModeContext;
