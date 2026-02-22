import React from "react";
import {
  TableRow,
  TableCell,
  Stack,
  Avatar,
  Box,
  Typography,
  Chip,
  IconButton,
  Fade,
} from "@mui/material";
import {
  Edit,
  Delete,
  Key,
  AdminPanelSettings,
  School,
  Person,
  CheckCircle,
  Cancel,
  MenuBook, // ✅ Thêm icon mới
} from "@mui/icons-material";

// Helper function để lấy cấu hình role
const getRoleConfig = (role) => {
  const configs = {
    admin: {
      icon: <AdminPanelSettings />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      label: "Admin",
      chipColor: "secondary",
    },
    teacher: {
      icon: <School />,
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      label: "Teacher",
      chipColor: "primary",
    },
    user: {
      icon: <Person />,
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      label: "User",
      chipColor: "info",
    },
  };
  return configs[role] || configs.user;
};

// Helper function để lấy initials từ tên
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const UserTableRow = ({
  user,
  index,
  onEdit,
  onDelete,
  onChangePassword,
  onManageCourses,
}) => {
  const roleConfig = getRoleConfig(user.role);
  // Teacher dùng teachingCourses, student dùng enrolledCourses
  const courseCount = user.role === "teacher"
    ? (user.teachingCourses?.length || 0)
    : (user.enrolledCourses?.length || 0);

  return (
    <Fade in={true} style={{ transitionDelay: `${index * 30}ms` }}>
      <TableRow
        sx={{
          "&:hover": {
            backgroundColor: "#f7fafc",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          },
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
      >
        {/* User Info with Avatar */}
        <TableCell>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                background: roleConfig.color,
                width: 45,
                height: 45,
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              {getInitials(user.fullname || user.username)}
            </Avatar>
            <Box>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: "#2d3748",
                }}
              >
                {user.fullname || user.username}
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        {/* Email */}
        <TableCell>
          <Typography
            variant="body2"
            sx={{
              color: "#4a5568",
            }}
          >
            {user.email}
          </Typography>
        </TableCell>

        {/* Username */}
        <TableCell>
          <Typography
            variant="body2"
            sx={{
              color: "#718096",
              fontFamily: "monospace",
              backgroundColor: "#edf2f7",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              display: "inline-block",
            }}
          >
            {user.username}
          </Typography>
        </TableCell>

        {/* Role */}
        <TableCell>
          <Chip
            icon={roleConfig.icon}
            label={roleConfig.label}
            color={roleConfig.chipColor}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          />
        </TableCell>

        {/* Status */}
        <TableCell>
          <Chip
            icon={
              user.isActive ? (
                <CheckCircle sx={{ fontSize: 16 }} />
              ) : (
                <Cancel sx={{ fontSize: 16 }} />
              )
            }
            label={user.isActive ? "Hoạt động" : "Khóa"}
            color={user.isActive ? "success" : "error"}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          />
        </TableCell>

        {/* Khóa học */}
        <TableCell align="center">
          <Chip
            label={`${courseCount} khóa học`}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              background:
                courseCount > 0
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "#e0e0e0",
              color: courseCount > 0 ? "white" : "#666",
            }}
          />
        </TableCell>

        {/* Actions */}
        <TableCell align="right">
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {/* ✅ Nút quản lý khóa học */}
            <IconButton
              onClick={() => onManageCourses(user)}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                width: 36,
                height: 36,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                },
                transition: "all 0.2s ease",
              }}
              size="small"
              title="Quản lý khóa học"
            >
              <MenuBook sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              onClick={() => onChangePassword(user)}
              sx={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
                width: 36,
                height: 36,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
                },
                transition: "all 0.2s ease",
              }}
              size="small"
            >
              <Key sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              onClick={() => onEdit(user)}
              sx={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
                width: 36,
                height: 36,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                },
                transition: "all 0.2s ease",
              }}
              size="small"
            >
              <Edit sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              onClick={() => onDelete(user)}
              sx={{
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                width: 36,
                height: 36,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                },
                transition: "all 0.2s ease",
              }}
              size="small"
            >
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>
    </Fade>
  );
};

// Custom comparison function để tối ưu re-render
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.user._id === nextProps.user._id &&
    prevProps.user.isActive === nextProps.user.isActive &&
    prevProps.user.role === nextProps.user.role &&
    prevProps.user.fullname === nextProps.user.fullname &&
    prevProps.user.email === nextProps.user.email &&
    prevProps.user.username === nextProps.user.username &&
    prevProps.user.enrolledCourses?.length ===
      nextProps.user.enrolledCourses?.length &&
    prevProps.user.teachingCourses?.length ===
      nextProps.user.teachingCourses?.length
  );
};

export default React.memo(UserTableRow, areEqual);
