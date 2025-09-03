import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import questionsData from "./data/questions.json";
import Header from "./components/Header";



export default function App() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    // Load dữ liệu từ file JSON
    setQuestions(questionsData);
  }, []);

  return (
    <div>
      <Header/>
      {questions.length > 0 ? (
        <Layout questions={questions} />
      ) : (
        <p>Đang tải câu hỏi...</p>
      )}
    </div>
  );
}
