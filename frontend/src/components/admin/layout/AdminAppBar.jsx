// =============================================================================
// AdminAppBar.jsx
// Top bar của admin: nhẹ, trắng, không còn gradient đậm.
// -----------------------------------------------------------------------------
// Thành phần (trái → phải):
//   1. Menu toggle button
//   2. Logo + brand title (responsive)
//   3. Theme toggle (Light/Dark)
//   4. AdminUserMenu (avatar dropdown)
//
// Lưu ý:
//   - Style lấy từ theme overrides MuiAppBar (đã cấu hình ở theme.js)
//   - Bỏ gradient hardcode và backdrop-filter cũ
// =============================================================================

import React, { useCallback } from "react";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "../../../context/ThemeContext";
import AdminUserMenu from "./AdminUserMenu";

function AdminAppBar({ onToggleSidebar, sidebarOpen }) {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleToggle = useCallback(() => {
    onToggleSidebar?.();
  }, [onToggleSidebar]);

  const menuLabel = sidebarOpen ? "Đóng menu" : "Mở menu";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        // Màu nền + border lấy từ theme overrides; ta chỉ add transition.
        transition: theme.transitions.create(
          ["background-color", "box-shadow", "border-color"],
          { duration: theme.transitions.duration.short }
        ),
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2, md: 3 },
          gap: 1,
        }}
      >
        {/* ===== Trái: Menu toggle + Logo + Title ===== */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
          <Tooltip title={menuLabel} arrow>
            <IconButton
              edge="start"
              onClick={handleToggle}
              aria-label={menuLabel}
              sx={{
                color: "inherit",
                minWidth: 44,
                minHeight: 44,
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>

          <Box
            component="img"
            src="/Logo_noback.png"
            alt="Logo TTE"
            sx={{
              height: { xs: 0, sm: 36, md: 40 },
              width: { xs: 0, sm: "auto" },
              display: { xs: "none", sm: "block" },
              transition: "transform 0.2s ease",
              "&:hover": { transform: "scale(1.05)" },
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
                "&:hover": { transform: "none" },
              },
            }}
          />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: { xs: "0.95rem", sm: "1.05rem", md: "1.15rem" },
                lineHeight: 1.2,
              }}
            >
              {isMobile ? "TTE Admin" : "Thanh Technology Education"}
            </Typography>
            {!isMobile && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                }}
              >
                Khu vực quản trị
              </Typography>
            )}
          </Box>
        </Box>

        {/* ===== Spacer ===== */}
        <Box sx={{ flexGrow: 1 }} />

        {/* ===== Phải: Theme toggle + User menu ===== */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
          <Tooltip title={isDark ? "Chế độ sáng" : "Chế độ tối"} arrow>
            <IconButton
              onClick={toggleTheme}
              aria-label={
                isDark
                  ? "Chuyển sang chế độ sáng"
                  : "Chuyển sang chế độ tối"
              }
              sx={{
                color: theme.palette.text.primary,
                minWidth: 44,
                minHeight: 44,
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <AdminUserMenu size={isMobile ? 34 : 38} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default React.memo(AdminAppBar);
