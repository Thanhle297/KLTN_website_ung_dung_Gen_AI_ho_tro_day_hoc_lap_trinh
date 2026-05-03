// =============================================================================
// AdminUserMenu.jsx
// Avatar + dropdown menu hiển thị thông tin user thực (decode từ JWT) thay
// cho chữ "A" hardcode trên AppBar cũ.
// -----------------------------------------------------------------------------
// Dropdown bao gồm:
//   - Header: Avatar tối chuẩn + fullname + role badge
//   - "Tài khoản" (điều hướng /profile)
//   - "Về trang chủ"
//   - "Đăng xuất" (gọi notifyLogout, xóa token, redirect /login)
// =============================================================================

import React, { useState, useMemo, useCallback, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { notifyLogout } from "../../../utils/sessionLogout";
import useNotify from "../../../hook/useNotify";

// Lấy user thông tin từ JWT (an toàn)
function readUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return {
      id: decoded.id,
      username: decoded.username || "",
      fullname: decoded.fullname || decoded.username || "",
      role: decoded.role || "user",
    };
  } catch {
    return null;
  }
}

// Map role -> nhãn tiếng Việt + màu chip
function getRoleMeta(role) {
  switch (role) {
    case "admin":
      return { label: "Quản trị viên", color: "primary" };
    case "teacher":
      return { label: "Giáo viên", color: "info" };
    default:
      return { label: role || "Người dùng", color: "default" };
  }
}

function AdminUserMenu({ size = 40 }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const notify = useNotify();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const buttonRef = useRef(null);

  // Memo để tránh decode lặp khi parent re-render
  const user = useMemo(() => readUserFromToken(), []);
  const initial = (user?.fullname || user?.username || "?")
    .charAt(0)
    .toUpperCase();
  const roleMeta = getRoleMeta(user?.role);

  const handleOpen = useCallback((e) => {
    setAnchorEl(e.currentTarget);
  }, []);
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleNavigate = useCallback(
    (path) => () => {
      handleClose();
      navigate(path);
    },
    [navigate, handleClose]
  );

  const handleLogout = useCallback(async () => {
    handleClose();
    try {
      await notifyLogout("manual");
    } catch {
      /* ignore */
    }
    localStorage.removeItem("token");
    notify("Đã đăng xuất", "success");
    navigate("/login");
  }, [navigate, notify, handleClose]);

  if (!user) {
    // Trường hợp hiếm: token biến mất khi đang ở admin (AdminRoute sẽ tự redirect)
    return null;
  }

  return (
    <>
      <Tooltip title="Tài khoản" arrow>
        <IconButton
          ref={buttonRef}
          onClick={handleOpen}
          aria-label="Mở menu tài khoản"
          aria-controls={open ? "admin-user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          sx={{
            p: 0.5,
            border: open
              ? `2px solid ${theme.palette.primary.main}`
              : "2px solid transparent",
            transition: "border-color 200ms ease",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <Avatar
            sx={{
              width: size,
              height: size,
              fontWeight: 700,
              fontSize: size * 0.42,
              background: theme.palette.gradient.primary,
              color: "#ffffff",
              boxShadow: "0 4px 14px -4px rgba(37, 99, 235, 0.45)",
            }}
          >
            {initial}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        id="admin-user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.customShadows?.dialog,
              overflow: "visible",
            },
          },
        }}
      >
        {/* User info header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary, display: "block" }}
          >
            Xin chào,
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              lineHeight: 1.2,
              mt: 0.25,
              wordBreak: "break-word",
            }}
          >
            {user.fullname}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              size="small"
              label={roleMeta.label}
              color={roleMeta.color}
              sx={{ fontWeight: 600, height: 22 }}
            />
          </Box>
        </Box>

        <Divider />

        <MenuItem onClick={handleNavigate("/profile")}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Tài khoản của tôi" />
        </MenuItem>

        <MenuItem onClick={handleNavigate("/")}>
          <ListItemIcon>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Về trang chủ" />
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={handleLogout}
          sx={{
            color: theme.palette.error.main,
            "& .MuiListItemIcon-root": { color: theme.palette.error.main },
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Đăng xuất" />
        </MenuItem>
      </Menu>
    </>
  );
}

export default React.memo(AdminUserMenu);
