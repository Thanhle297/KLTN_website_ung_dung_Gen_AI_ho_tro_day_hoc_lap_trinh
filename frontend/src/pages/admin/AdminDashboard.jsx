import React, { useState, memo, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import People from "@mui/icons-material/People";
import School from "@mui/icons-material/School";
import Book from "@mui/icons-material/Book";
import Topic from "@mui/icons-material/Topic";
import Quiz from "@mui/icons-material/Quiz";
import Home from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import Assignment from "@mui/icons-material/Assignment";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import ScrollToTop from "../../components/ScrollToTop";
import UsersCRUD from "./UsersCRUD";
import CoursesCRUD from "./CoursesCRUD";
import LessonsCRUD from "./LessonsCRUD";
import SubLessonsCRUD from "./SubLessonsCRUD";
import QuestionsCRUD from "./QuestionsCRUD";
import QuestionBank from "./QuestionBank";
import EnrollmentsCRUD from "./EnrollmentsCRUD";
import CourseReportPage from "./ReportPage";

// ============================================================================
// CONSTANTS - Hoisted outside component for performance (rendering-hoist-jsx)
// ============================================================================
const DRAWER_FULL_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 72;

// Menu items hoisted outside to prevent recreation on every render
const MENU_ITEMS = [
  { label: "Quản lý User", path: "users", Icon: People },
  { label: "Ngân hàng câu hỏi", path: "question-bank", Icon: Assignment },
  { label: "Quản lý Khóa học", path: "courses", Icon: School },
  { label: "Quản lý Bài học", path: "lessons", Icon: Book },
  { label: "Quản lý SubLesson", path: "sub-lessons", Icon: Topic },
  { label: "Câu hỏi theo bài", path: "questions", Icon: Quiz },
  { label: "Quản lý Phân bổ", path: "enrollments", Icon: Assignment },
];

// Transition timing - explicit properties instead of 'all' (Web Guidelines: Animation)
const SIDEBAR_TRANSITION = "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
const MENU_ITEM_TRANSITION = "background-color 0.2s ease, transform 0.2s ease, border-left 0.2s ease";

// ============================================================================
// MEMOIZED SUB-COMPONENTS (rerender-memo)
// ============================================================================

/**
 * SidebarMenuItem - Memoized menu item with responsive behavior
 * - Full text on desktop
 * - Icon only with tooltip on tablet (collapsed mode)
 * - Touch-friendly tap targets (min 44px)
 */
const SidebarMenuItem = memo(function SidebarMenuItem({
  item,
  isSelected,
  isCollapsed,
  onClick,
}) {
  const { label, path, Icon } = item;

  const menuButton = (
    <ListItemButton
      component={Link}
      to={`/admin/${path}`}
      selected={isSelected}
      onClick={onClick}
      sx={{
        borderRadius: isCollapsed ? 2 : 3,
        mb: 1.5,
        py: 1.5,
        px: isCollapsed ? 1.5 : 2,
        minHeight: 48, // Touch-friendly: min 44px tap target
        justifyContent: isCollapsed ? "center" : "flex-start",
        transition: MENU_ITEM_TRANSITION,
        touchAction: "manipulation", // Prevents double-tap zoom delay
        WebkitTapHighlightColor: "transparent",
        "&.Mui-selected": {
          background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
          color: "#1976D2",
          boxShadow: "0 2px 8px rgba(33, 150, 243, 0.12)",
          "&:hover": {
            background: "linear-gradient(135deg, #BBDEFB 0%, #E3F2FD 100%)",
            transform: isCollapsed ? "scale(1.05)" : "translateX(4px)",
          },
          "& .MuiListItemIcon-root": { color: "#1976D2" },
        },
        "&:hover": {
          backgroundColor: "#F5F9FC",
          transform: isCollapsed ? "scale(1.05)" : "translateX(4px)",
          borderLeft: isCollapsed ? "none" : "3px solid #2196F3",
        },
        // Focus visible state for accessibility
        "&:focus-visible": {
          outline: "2px solid #1976D2",
          outlineOffset: 2,
        },
        // Reduced motion support
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:hover": {
            transform: "none",
          },
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: isCollapsed ? 0 : 40,
          mr: isCollapsed ? 0 : 1,
          color: isSelected ? "#1976D2" : "#2196F3",
          transition: "color 0.2s ease",
          justifyContent: "center",
        }}
      >
        <Icon />
      </ListItemIcon>
      {!isCollapsed && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontWeight: isSelected ? 600 : 500,
            fontSize: "0.95rem",
            letterSpacing: "0.3px",
            noWrap: true, // Prevent text overflow
          }}
        />
      )}
    </ListItemButton>
  );

  // Wrap with Tooltip when collapsed for accessibility
  if (isCollapsed) {
    return (
      <Tooltip title={label} placement="right" arrow>
        {menuButton}
      </Tooltip>
    );
  }

  return menuButton;
});

/**
 * SidebarContent - Memoized sidebar content
 */
const SidebarContent = memo(function SidebarContent({
  isCollapsed,
  onItemClick,
  currentPath,
}) {
  return (
    <Box
      sx={{
        overflow: "auto",
        mt: 2,
        px: isCollapsed ? 1 : 2,
      }}
    >
      <List>
        {MENU_ITEMS.map((item) => {
          const isSelected = currentPath.startsWith(`/admin/${item.path}`);
          return (
            <SidebarMenuItem
              key={item.path}
              item={item}
              isSelected={isSelected}
              isCollapsed={isCollapsed}
              onClick={onItemClick}
            />
          );
        })}
      </List>
    </Box>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const theme = useTheme();

  // Responsive breakpoints using derived boolean state (rerender-derived-state)
  // This reduces re-renders compared to subscribing to continuous values
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg")); // 600px - 1199px
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg")); // >= 1200px

  // Derived sidebar state (rerender-derived-state)
  const isCollapsed = useMemo(() => {
    return isTablet && sidebarOpen;
  }, [isTablet, sidebarOpen]);

  // Calculate drawer width based on screen size
  const drawerWidth = useMemo(() => {
    if (isMobile) return DRAWER_FULL_WIDTH; // Full width for temporary drawer
    if (isCollapsed) return DRAWER_COLLAPSED_WIDTH;
    return DRAWER_FULL_WIDTH;
  }, [isMobile, isCollapsed]);

  // Stable callbacks using functional setState (rerender-functional-setstate)
  const handleDrawerToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarItemClick = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleNavigateHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Dynamic aria-label for accessibility
  const menuButtonAriaLabel = sidebarOpen ? "Đóng menu" : "Mở menu";

  // Calculate main content margin
  const mainContentMarginLeft = useMemo(() => {
    if (isMobile) return 0;
    if (!sidebarOpen) return 0;
    return drawerWidth;
  }, [isMobile, sidebarOpen, drawerWidth]);

  // Responsive avatar size
  const avatarSize = useMemo(() => {
    if (isMobile) return 32;
    if (isTablet) return 36;
    return 40;
  }, [isMobile, isTablet]);

  // Common drawer paper styles
  const drawerPaperSx = useMemo(
    () => ({
      width: drawerWidth,
      background: "#FFFFFF",
      borderRight: "1px solid #E3F2FD",
      transition: SIDEBAR_TRANSITION,
      overflowX: "hidden",
    }),
    [drawerWidth]
  );

  return (
    <Box sx={{ display: "flex" }}>
      <ScrollToTop />

      {/* ================================================================== */}
      {/* HEADER - Responsive AppBar */}
      
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background:
            "linear-gradient(135deg, #42A5F5 0%, #2196F3 50%, #1976D2 100%)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 12px rgba(33, 150, 243, 0.15)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            minHeight: { xs: 56, sm: 64 }, // Responsive toolbar height
            px: { xs: 1, sm: 2, md: 3 }, // Responsive horizontal padding
          }}
        >
          {/* Left section: Menu button + Logo + Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
            <IconButton
              color="inherit"
              aria-label={menuButtonAriaLabel}
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                color: "white",
                minWidth: 44, // Touch-friendly
                minHeight: 44,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  transform: "scale(1.1)",
                },
                "&:focus-visible": {
                  outline: "2px solid white",
                  outlineOffset: 2,
                },
                transition: "background-color 0.2s ease, transform 0.2s ease",
                "@media (prefers-reduced-motion: reduce)": {
                  transition: "none",
                  "&:hover": { transform: "none" },
                },
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo - hidden on xs, shown on sm+ */}
            <Box
              component="img"
              src="/Logo_noback.png"
              alt="Logo"
              sx={{
                height: { xs: 0, sm: 40, md: 50 },
                width: { xs: 0, sm: "auto" },
                display: { xs: "none", sm: "block" },
                filter: "drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3))",
                transition: "transform 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
                "@media (prefers-reduced-motion: reduce)": {
                  transition: "none",
                  "&:hover": { transform: "none" },
                },
              }}
            />

            {/* Title - responsive text */}
            <Typography
              variant="h5"
              noWrap
              fontWeight="600"
              sx={{
                color: "white",
                letterSpacing: "0.5px",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                maxWidth: { xs: 150, sm: 250, md: "none" }, // Prevent overflow on mobile
              }}
            >
              {isMobile ? "TTE Admin" : "Thanh Technology Education"}
            </Typography>
          </Box>

          {/* Right section: Home button + Avatar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
            {/* Home button - icon only on mobile/tablet, with text on desktop */}
            <Tooltip title={isDesktop ? "" : "Về trang chủ"} arrow>
              <Button
                startIcon={<Home />}
                onClick={handleNavigateHome}
                aria-label="Về trang chủ"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  px: { xs: 1.5, lg: 2.5 },
                  py: 1,
                  minWidth: 44,
                  minHeight: 44,
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid white",
                    outlineOffset: 2,
                  },
                  transition: "background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                  },
                  // Hide text on mobile/tablet, show only icon
                  "& .MuiButton-startIcon": {
                    mr: { xs: 0, lg: 1 },
                  },
                }}
              >
                {/* Only show text on desktop */}
                <Box
                  component="span"
                  sx={{
                    display: { xs: "none", lg: "inline" },
                  }}
                >
                  Về trang chủ
                </Box>
              </Button>
            </Tooltip>

            {/* Avatar - responsive size */}
            <Avatar
              sx={{
                bgcolor: "white",
                color: "#2196F3",
                width: avatarSize,
                height: avatarSize,
                fontWeight: 600,
                fontSize: { xs: "0.875rem", sm: "1rem" },
                boxShadow: "0 2px 8px rgba(33, 150, 243, 0.2)",
              }}
            >
              A
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      
      {/* SIDEBAR - Responsive Drawer */}
      <Box component="nav" aria-label="Admin navigation">
        {/* Mobile: Temporary drawer (overlay) */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={sidebarOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }} // Better mobile performance
            sx={{
              "& .MuiDrawer-paper": {
                ...drawerPaperSx,
                width: DRAWER_FULL_WIDTH, // Always full width for mobile
              },
            }}
          >
            <Toolbar />
            <SidebarContent
              isCollapsed={false}
              onItemClick={handleSidebarItemClick}
              currentPath={location.pathname}
            />
          </Drawer>
        ) : (
          /* Tablet/Desktop: Persistent drawer */
          <Drawer
            variant="persistent"
            open={sidebarOpen}
            sx={{
              "& .MuiDrawer-paper": drawerPaperSx,
            }}
          >
            <Toolbar />
            <SidebarContent
              isCollapsed={isCollapsed}
              onItemClick={handleSidebarItemClick}
              currentPath={location.pathname}
            />
          </Drawer>
        )}
      </Box>

      {/* ================================================================== */}
      {/* MAIN CONTENT - Responsive layout */}
      {/* ================================================================== */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0, // No padding - child components handle their own spacing
          background:
            "linear-gradient(135deg, #E3F2FD 0%, #FFFFFF 50%, #E8F5E9 100%)",
          minHeight: "100vh",
          maxWidth: "100%",
          overflowX: "hidden",
          ml: `${mainContentMarginLeft}px`,
          transition: SIDEBAR_TRANSITION,
          // Safe area for notched devices
          pb: "env(safe-area-inset-bottom, 0)",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        <Toolbar />

        <Routes>
          <Route path="users" element={<UsersCRUD />} />
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="courses" element={<CoursesCRUD />} />
          <Route
            path="course-report/:courseId"
            element={<CourseReportPage />}
          />
          <Route path="lessons" element={<LessonsCRUD />} />
          <Route path="sub-lessons" element={<SubLessonsCRUD />} />
          <Route path="questions" element={<QuestionsCRUD />} />
          <Route path="enrollments" element={<EnrollmentsCRUD />} />
        </Routes>
      </Box>
    </Box>
  );
}
