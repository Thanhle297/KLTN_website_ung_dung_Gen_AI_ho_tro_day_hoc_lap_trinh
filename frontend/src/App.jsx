import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Layout from "./components/Layout";
import questionsData from "./data/questions.json";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import CodeEx from "./pages/CodeEx";

export default function App() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    // Load dữ liệu từ file JSON
    setQuestions(questionsData);
  }, []);

  return (
    <div>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<h1>Trang Giới thiệu</h1>} />
          <Route path="/CodeEx" element={<CodeEx questions={questions}/>} />
          <Route path="/contact" element={<h1>Liên hệ</h1>} />
        </Routes>
      </Router>
      {/* <Header />
      {questions.length > 0 ? (
        <Layout questions={questions} />
      ) : (
        <p>Đang tải câu hỏi...</p>
      )} */}
    </div>
  );
}
