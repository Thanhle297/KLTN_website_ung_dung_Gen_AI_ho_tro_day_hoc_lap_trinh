import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Toolbar,
  AppBar,
  Typography,
  Button,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  People,
  School,
  Book,
  Topic,
  Quiz,
  Dashboard as DashboardIcon,
  Home,
  Menu as MenuIcon,
  Assignment,
} from "@mui/icons-material";
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

const drawerWidth = 260;

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menu = [
    { label: "Quản lý User", path: "users", icon: <People /> },
    { label: "Ngân hàng câu hỏi", path: "question-bank", icon: <Assignment /> },
    { label: "Quản lý Khóa học", path: "courses", icon: <School /> },
    { label: "Quản lý Bài học", path: "lessons", icon: <Book /> },
    { label: "Quản lý SubLesson", path: "sub-lessons", icon: <Topic /> },
    { label: "Câu hỏi theo bài", path: "questions", icon: <Quiz /> },
    { label: "Quản lý Phân bổ", path: "enrollments", icon: <Assignment /> },
  ];

  const drawerContent = (
    <Box sx={{ overflow: "auto", mt: 2, px: 2 }}>
      <List>
        {menu.map((item) => {
          const isSelected = location.pathname.startsWith(
            `/admin/${item.path}`
          );
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={`/admin/${item.path}`}
              selected={isSelected}
              onClick={() => isMobile && setSidebarOpen(false)}
              sx={{
                borderRadius: 3,
                mb: 1.5,
                py: 1.5,
                transition: "all 0.3s ease",
                "&.Mui-selected": {
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                    transform: "translateX(4px)",
                  },
                  "& .MuiListItemIcon-root": { color: "white" },
                },
                "&:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.08)",
                  transform: "translateX(4px)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isSelected ? "white" : "#667eea",
                  transition: "all 0.3s ease",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.95rem",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <ScrollToTop />
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.3)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  transform: "scale(1.1)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src="/Logo_noback.png"
              alt="Logo"
              sx={{
                height: 50,
                display: { xs: "none", sm: "block" },
                // filter: "brightness(0) invert(1)",
              }}
            />
            <Typography
              variant="h5"
              noWrap
              fontWeight="700"
              sx={{
                color: "white",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              Thanh Technology Education
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              startIcon={<Home />}
              onClick={() => navigate("/")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "white",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                px: 2.5,
                py: 1,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.25)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Về trang chủ
            </Button>
            <Avatar
              sx={{
                bgcolor: "white",
                color: "#667eea",
                width: 40,
                height: 40,
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
            >
              A
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav">
        {/* Mobile: temporary drawer */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={sidebarOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
                borderRight: "1px solid rgba(102, 126, 234, 0.1)",
              },
            }}
          >
            <Toolbar />
            {drawerContent}
          </Drawer>
        ) : (
          /* Desktop: persistent drawer */
          <Drawer
            variant="persistent"
            open={sidebarOpen}
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
                borderRight: "1px solid rgba(102, 126, 234, 0.1)",
              },
            }}
          >
            <Toolbar />
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // p: 1,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          minHeight: "100vh",
          ml: sidebarOpen && !isMobile ? `${drawerWidth}px` : 0,
          transition: "margin-left 0.3s ease",
        }}
      >
        <Toolbar />

        <Routes>
          <Route path="users" element={<UsersCRUD />} />
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="courses" element={<CoursesCRUD />} />
          <Route path="lessons" element={<LessonsCRUD />} />
          <Route path="sub-lessons" element={<SubLessonsCRUD />} />
          <Route path="questions" element={<QuestionsCRUD />} />
          <Route path="enrollments" element={<EnrollmentsCRUD />} />
        </Routes>
      </Box>
    </Box>
  );
}
