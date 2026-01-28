// src/components/EditModeToggle.jsx
// Component nút bật/tắt chế độ chỉnh sửa (Edit Mode)
// Hiển thị cho Teacher và Admin khi có quyền edit

import React from "react";
import { Box, Button, Tooltip, CircularProgress } from "@mui/material";
import { Visibility, Edit } from "@mui/icons-material";
import { useEditMode } from "../context/EditModeContext";

/**
 * Nút toggle Edit Mode
 * - Chỉ hiện khi user có quyền edit (canEdit = true)
 * - OFF: "Xem" - màu xám
 * - ON: "Chỉnh sửa" - màu tím gradient
 */
function EditModeToggle() {
  const { editMode, toggleEditMode, canEdit, loading, userRole } = useEditMode();

  // Không hiển thị nếu đang loading hoặc không có quyền
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", px: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (!canEdit) {
    return null;
  }

  return (
    <Tooltip
      title={
        editMode
          ? "Tắt chế độ chỉnh sửa để xem như học sinh"
          : "Bật chế độ chỉnh sửa để quản lý bài học"
      }
      arrow
    >
      <Button
        variant={editMode ? "contained" : "outlined"}
        startIcon={editMode ? <Edit /> : <Visibility />}
        onClick={toggleEditMode}
        sx={{
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 600,
          px: 2.5,
          py: 1,
          minWidth: 140,
          transition: "all 0.3s ease",
          ...(editMode
            ? {
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                  boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)",
                },
              }
            : {
                borderColor: "#9e9e9e",
                color: "#616161",
                background: "rgba(255, 255, 255, 0.9)",
                "&:hover": {
                  borderColor: "#667eea",
                  color: "#667eea",
                  background: "rgba(102, 126, 234, 0.08)",
                },
              }),
        }}
      >
        {editMode ? "Chỉnh sửa" : "Xem"}
      </Button>
    </Tooltip>
  );
}

export default React.memo(EditModeToggle);
