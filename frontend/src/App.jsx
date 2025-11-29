// import { useEffect, useState } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   useLocation,
// } from "react-router-dom";
// import Header from "./components/Header";
// import HomePage from "./pages/HomePage";
// import Courses from "./pages/Courses";
// import Lessons from "./pages/Lessons";
// import CodeEx from "./pages/CodeEx";
// import Login from "./auth/login";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Contact from "./pages/Contact";

// // Component con nằm trong Router
// function AppContent() {
//   const location = useLocation();
//   const [questions, setQuestions] = useState([]);

//   const hideHeader = location.pathname === "/login";

//   return (
//     <>
//       {!hideHeader && <Header />}
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route
//           path="/"
//           element={
//             // <HomePage/>
//             <ProtectedRoute>
//               <HomePage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/course"
//           element={
//             // <Courses />
//             <ProtectedRoute>
//               <Courses />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/course/:classId"
//           element={
//             // <Lessons />
//             <ProtectedRoute>
//               <Lessons />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/lesson/:lessonId"
//           element={
//             // <CodeEx />
//             <ProtectedRoute>
//               <CodeEx />
//             </ProtectedRoute>
//           }
//         />
//         <Route path="/Contact" element={<Contact/>}/>
//       </Routes>
//     </>
//   );
// }

// export default function App() {

//   return (
//     <Router>
//       <AppContent/>
//     </Router>
//   );
// }

import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {ThemeProvider,createTheme} from '@mui/material/styles'
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import Courses from "./pages/Courses";
import Lessons from "./pages/Lessons";
import CodeEx from "./pages/CodeEx";
import CodeExSimple from "./pages/CodeExSimple";
import Login from "./auth/login";
import ProtectedRoute from "./routes/ProtectedRoute";
import Contact from "./pages/Contact";
import SessionWarning from "./components/SessionWarning";
import Profile from "./pages/Profile";
//dashboard admin
import AdminRoute from "./routes/AdminRoute"
import AdminDashboard from "./pages/admin/AdminDashboard";

// MUI theme

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
  },
});

// ====================
// Token & inactivity utilities
// ====================
function isTokenExpired() {
  const token = localStorage.getItem("token");
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch {
    return true;
  }
}

let logoutTimer;
let warningTimer;
let lastActivity = Date.now();
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 phút
const WARNING_TIME = 60 * 1000; // cảnh báo 1 phút trước khi logout

function resetActivityTimer(onTimeout, onWarning) {
  lastActivity = Date.now();
  clearTimeout(logoutTimer);
  clearTimeout(warningTimer);

  // hiện popup cảnh báo trước 1 phút
  warningTimer = setTimeout(() => {
    const inactiveTime = Date.now() - lastActivity;
    if (inactiveTime >= INACTIVITY_LIMIT - WARNING_TIME) onWarning();
  }, INACTIVITY_LIMIT - WARNING_TIME);

  // logout khi quá thời gian
  logoutTimer = setTimeout(() => {
    const inactiveTime = Date.now() - lastActivity;
    if (inactiveTime >= INACTIVITY_LIMIT) onTimeout();
  }, INACTIVITY_LIMIT);
}

// ====================
// Component chính trong Router
// ====================
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const hideHeader =
  location.pathname === "/login" ||
  location.pathname.startsWith("/admin");

  useEffect(() => {
    const handleLogout = () => {
      localStorage.clear();
      navigate("/login");
    };

    if (isTokenExpired()) handleLogout();

    const handleWarning = () => {
      setShowWarning(true);
      setCountdown(60);
    };

    const reset = () => {
      setShowWarning(false);
      resetActivityTimer(handleLogout, handleWarning);
    };

    // theo dõi hoạt động người dùng
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    reset();

    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      clearTimeout(logoutTimer);
      clearTimeout(warningTimer);
    };
  }, [navigate]);

  // đếm ngược trong popup
  useEffect(() => {
    if (!showWarning) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showWarning]);

  return (
    <>
      {!hideHeader && <Header />}

      {showWarning && (
        <SessionWarning
          countdown={countdown}
          onContinue={() => {
            setShowWarning(false);
            resetActivityTimer(
              () => {
                localStorage.clear();
                navigate("/login");
              },
              () => setShowWarning(true)
            );
          }}
          onLogout={() => {
            localStorage.clear();
            navigate("/login");
          }}
        />
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:classId"
          element={
            <ProtectedRoute>
              <Lessons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson/:lessonId"
          element={
            <ProtectedRoute>
              <CodeEx />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson-simple/:lessonId"
          element={
            <ProtectedRoute>
              <CodeExSimple />
            </ProtectedRoute>
          }
        />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile/>} />

        {/* ✅ Admin Dashboard, chỉ admin mới vào được */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>

      
    </>
  );
}

// ====================
// App chính
// ====================
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}
