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
} from "@mui/icons-material";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import UsersCRUD from "./UsersCRUD";
import CoursesCRUD from "./CoursesCRUD";
import LessonsCRUD from "./LessonsCRUD";
import SubLessonsCRUD from "./SubLessonsCRUD";
import QuestionsCRUD from "./QuestionsCRUD";

const drawerWidth = 240;

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
    { label: "Quản lý Khóa học", path: "courses", icon: <School /> },
    { label: "Quản lý Bài học", path: "lessons", icon: <Book /> },
    { label: "Quản lý SubLesson", path: "sub-lessons", icon: <Topic /> },
    { label: "Quản lý Câu hỏi", path: "questions", icon: <Quiz /> },
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
                borderRadius: 2,
                mb: 1,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "&:hover": { backgroundColor: "primary.dark" },
                  "& .MuiListItemIcon-root": { color: "white" },
                },
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isSelected ? "white" : "text.secondary",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isSelected ? 600 : 400,
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
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "#fff",
          color: "#333",
          boxShadow: "0px 1px 10px rgba(0,0,0,0.05)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <DashboardIcon
              color="primary"
              sx={{ display: { xs: "none", sm: "block" } }}
            />
            <Typography variant="h5" noWrap fontWeight="bold" color="primary">
              Admin Dashboard
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              startIcon={<Home />}
              onClick={() => navigate("/")}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                },
                display: "flex",
              }}
            >
              Về trang chủ
            </Button>
            <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
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
                backgroundColor: "#f8f9fa",
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
                backgroundColor: "#f8f9fa",
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
          p: 3,
          backgroundColor: "#f4f6f8",
          minHeight: "100vh",
          ml: sidebarOpen && !isMobile ? `${drawerWidth}px` : 0,
          transition: "margin-left 0.3s ease",
        }}
      >
        <Toolbar />

        <Routes>
          <Route path="users" element={<UsersCRUD />} />
          <Route path="courses" element={<CoursesCRUD />} />
          <Route path="lessons" element={<LessonsCRUD />} />
          <Route path="sub-lessons" element={<SubLessonsCRUD />} />
          <Route path="questions" element={<QuestionsCRUD />} />
        </Routes>
      </Box>
    </Box>
  );
}
