import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Layout from "./components/Layout";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import CodeEx from "./pages/CodeEx";
import Login from "./auth/login";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [questions, setQuestions] = useState([]);

  return (
    <div>
      <Router>
        <Header />
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<h1>Trang Giới thiệu</h1>} />
          <Route path="/CodeEx" element={<CodeEx questions={questions}/>} />
          <Route path="/Contact" element={<h1>Liên hệ</h1>} />
        </Routes>
      </Router>
    </div>
  );
}

// <ProtectedRoute>{}</ProtectedRoute>