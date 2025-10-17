// import { useEffect, useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Header from "./components/Header";
// import HomePage from "./pages/HomePage";
// import CodeEx from "./pages/CodeEx";
// import Login from "./auth/login";
// import ProtectedRoute from "./components/ProtectedRoute";

// export default function App() {
//   const [questions, setQuestions] = useState([]);

//   return (
//     <div>
//       <Router>
//         <Header />
//         <Routes>
//           <Route path="/login" element={<Login/>}/>
//           <Route path="/" element={<HomePage />} />
//           <Route path="/about" element={<h1>Khóa học của bạn</h1>} />
//           <Route path="/CodeEx" element={<CodeEx questions={questions}/>} />
//           <Route path="/Contact" element={<h1>Liên hệ</h1>} />
//         </Routes>
//       </Router>
//     </div>
//   );
// }

// <ProtectedRoute>{}</ProtectedRoute>

import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import Courses from "./pages/Courses";
import Lessons from "./pages/Lessons";
import CodeEx from "./pages/CodeEx";
import Login from "./auth/login";
import ProtectedRoute from "./components/ProtectedRoute";
import Contact from "./pages/Contact";

// Component con nằm trong Router
function AppContent() {
  const location = useLocation();
  const [questions, setQuestions] = useState([]);

  const hideHeader = location.pathname === "/login";

  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            // <HomePage/>
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course"
          element={
            // <Courses />
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:classId"
          element={
            // <Lessons />
            <ProtectedRoute>
              <Lessons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson/:lessonId"
          element={
            // <CodeEx />
            <ProtectedRoute>
              <CodeEx />
            </ProtectedRoute>
          }
        />
        <Route path="/Contact" element={<Contact/>}/>
      </Routes>
    </>
  );
}

export default function App() {

  return (
    <Router>
      <AppContent/>
    </Router>
  );
}
