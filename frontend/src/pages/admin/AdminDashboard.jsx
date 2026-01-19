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
                py: 2,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                "&.Mui-selected": {
                  background:
                    "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
                  color: "#1976D2",
                  boxShadow: "0 2px 8px rgba(33, 150, 243, 0.12)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #BBDEFB 0%, #E3F2FD 100%)",
                    transform: "translateX(4px)",
                  },
                  "& .MuiListItemIcon-root": { color: "#1976D2" },
                },
                "&:hover": {
                  backgroundColor: "#F5F9FC",
                  transform: "translateX(4px)",
                  borderLeft: "3px solid #2196F3",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isSelected ? "#1976D2" : "#2196F3",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: "0.95rem",
                  letterSpacing: "0.3px",
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
          background:
            "linear-gradient(135deg, #42A5F5 0%, #2196F3 50%, #1976D2 100%)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 12px rgba(33, 150, 243, 0.15)",
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
                filter: "drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3))",
                transition: "transform 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            />
            <Typography
              variant="h5"
              noWrap
              fontWeight="600"
              sx={{
                color: "white",
                letterSpacing: "0.5px",
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
                color: "#2196F3",
                width: 40,
                height: 40,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(33, 150, 243, 0.2)",
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
                background: "#FFFFFF",
                borderRight: "1px solid #E3F2FD",
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
                background: "#FFFFFF",
                borderRight: "1px solid #E3F2FD",
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
          background:
            "linear-gradient(135deg, #E3F2FD 0%, #FFFFFF 50%, #E8F5E9 100%)",
          minHeight: "100vh",
          ml: sidebarOpen && !isMobile ? `${drawerWidth}px` : 0,
          transition: "margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
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
