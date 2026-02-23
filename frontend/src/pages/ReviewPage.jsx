import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ReviewPage.scss";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { useThemeMode } from "../context/ThemeContext";

export default function ReviewPage() {
  const { isDark } = useThemeMode();
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch chi tiết bài nộp
  useEffect(() => {
    async function fetchData() {
      try {
        const resSub = await fetch(
          `${process.env.REACT_APP_API_URL}/api/submit/detail/${submissionId}`
        );
        const subData = await resSub.json();
        setSubmission(subData);

        if (subData.questions && subData.questions.length > 0) {
          // ✅ Ưu tiên dùng snapshot câu hỏi đã lưu khi nộp bài
          setQuestions(subData.questions);
        } else if (subData.lessonId) {
          // 2. Fetch câu hỏi gốc (bao gồm đáp án đúng) - Fallback cho bài cũ
          const courseParam = subData.courseId ? `&courseId=${subData.courseId}` : "";
          const resQ = await fetch(
            `${process.env.REACT_APP_API_URL}/api/questions?lessonId=${subData.lessonId}${courseParam}`
          );
          const qData = await resQ.json();
          setQuestions(qData);
        }
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu review:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [submissionId]);

  if (loading) return <LoadingSpinner label="Đang tải bài xem lại..." />;
  if (!submission) return <p>Không tìm thấy bài nộp.</p>;

  // Tính toán lại để hiển thị
  const editorStates = submission.editorStates || {};

  return (
    <div className="review-page-container">
      <div className="review-header">
        <button type="button" className="back-btn" onClick={() => navigate(`/course/${submission.courseId}`)}>
          <FaArrowLeft /> Quay lại
        </button>
        <h1>
          Xem lại bài làm{" "}
          <span className="score">
            ({submission.correct}/{submission.total} câu đúng -{" "}
            {submission.progress}%)
          </span>
        </h1>
        <div className="date">
          {new Date(submission.createdAt).toLocaleString("vi-VN")}
        </div>
      </div>

      <div className="review-questions-list">
        {questions.map((q, index) => {
          const userState = editorStates[q.id] || {};
          const userAns = userState.code || ""; // code chứa đáp án text
          const isCorrect = userState.status === "correct";

          // Kiểm tra xem có phải câu hỏi code không
          const isCodeQuestion =
            !!q.testcase ||
            (typeof userAns === "string" && userAns.includes("def "));

          return (
            <div
              key={q._id}
              className={`review-question-card ${
                isCorrect ? "correct" : "wrong"
              }`}
            >
              <div className="q-header">
                <h2>Câu {index + 1}:</h2>
                <span className={`status-badge ${isCorrect ? "ok" : "err"}`}>
                  {isCorrect ? (
                    <>
                      <FaCheckCircle /> Đúng
                    </>
                  ) : (
                    <>
                      <FaTimesCircle /> Sai
                    </>
                  )}
                </span>
              </div>

              <div className="q-content">
                <div
                  className="q-text"
                  dangerouslySetInnerHTML={{ __html: q.question || q.text }}
                />
                {q.image && <img src={q.image} alt={`Hình ảnh câu ${index + 1}`} />}
              </div>

              <div className="q-answers">
                <div className="user-answer-box">
                  <strong>Câu trả lời của bạn:</strong>
                  {isCodeQuestion ? (
                    <div
                      className={`code-view-wrapper ${
                        isCorrect ? "green-border" : "red-border"
                      }`}
                    >
                      <CodeMirror
                        value={userAns || "# Chưa trả lời"}
                        height="auto"
                        extensions={[python(), EditorView.editable.of(false)]}
                        readOnly={true}
                        theme={isDark ? oneDark : "light"}
                        basicSetup={{
                          lineNumbers: true,
                          foldGutter: false,
                          highlightActiveLine: false,
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`ans-content ${isCorrect ? "green" : "red"}`}
                    >
                      {userAns || "(Chưa trả lời)"}
                    </div>
                  )}
                </div>

                {!isCorrect && (
                  <div className="correct-answer-box">
                    <strong>Đáp án đúng / Gợi ý:</strong>
                    <div className="ans-content blue">
                      {q.solution ||
                        q.testcase?.[0]?.output ||
                        "Xem giải thích bên dưới"}
                    </div>
                  </div>
                )}

                {/* Nếu có giải thích chi tiết */}
                {q.explanation && (
                  <div className="explanation-box">
                    <strong>Giải thích:</strong> {q.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
