// =============================================================================
// AdminLayout.jsx
// Wrapper chính cho khu vực quản trị. Thả children là nested <Routes>.
// -----------------------------------------------------------------------------
// Thành phần:
//   - <AdminAppBar>            (top bar)
//   - <AdminSidebar>           (drawer)
//   - <main>
//       <AdminBreadcrumbs />
//       {children}             (Route content)
// =============================================================================

import React, { useState, useMemo, useCallback } from "react";
import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import ScrollToTop from "../../ScrollToTop";
import AdminAppBar from "./AdminAppBar";
import AdminSidebar, {
  DRAWER_FULL_WIDTH,
  DRAWER_COLLAPSED_WIDTH,
} from "./AdminSidebar";
import AdminBreadcrumbs from "./AdminBreadcrumbs";

const SIDEBAR_TRANSITION =
  "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

export default function AdminLayout({ children }) {
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  // tablet + sidebar open => collapsed icon-only
  const isCollapsed = isTablet && sidebarOpen;

  const drawerWidth = useMemo(() => {
    if (isMobile) return DRAWER_FULL_WIDTH;
    if (isCollapsed) return DRAWER_COLLAPSED_WIDTH;
    return DRAWER_FULL_WIDTH;
  }, [isMobile, isCollapsed]);

  const mainMarginLeft = useMemo(() => {
    if (isMobile) return 0;
    if (!sidebarOpen) return 0;
    return drawerWidth;
  }, [isMobile, sidebarOpen, drawerWidth]);

  const handleToggle = useCallback(() => {
    setSidebarOpen((p) => !p);
  }, []);

  const handleClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <ScrollToTop />

      <AdminAppBar onToggleSidebar={handleToggle} sidebarOpen={sidebarOpen} />

      <AdminSidebar
        open={sidebarOpen}
        onClose={handleClose}
        isMobile={isMobile}
        isCollapsed={isCollapsed}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          maxWidth: "100%",
          overflowX: "hidden",
          ml: `${mainMarginLeft}px`,
          transition: SIDEBAR_TRANSITION,
          backgroundColor: theme.palette.adminBg.page,
          // Safe area for notched devices
          pb: "env(safe-area-inset-bottom, 0)",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />

        <Box
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            pt: { xs: 1, sm: 1.5 },
          }}
        >
          <AdminBreadcrumbs />
        </Box>

        <Box>{children}</Box>
      </Box>
    </Box>
  );
}
