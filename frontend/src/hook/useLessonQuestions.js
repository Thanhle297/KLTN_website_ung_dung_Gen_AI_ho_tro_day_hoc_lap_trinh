import { useEffect, useState } from "react";

export default function useLessonQuestions(lessonId, userId) {
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [editorStates, setEditorStates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId || !userId) return;

    async function loadData() {
      try {
        // 1️⃣ Lấy thông tin bài học
        const lessonRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/lessons/detail/${lessonId}`
        );
        const lessonData = await lessonRes.json();
        setLesson(lessonData);

        // 2️⃣ Lấy câu hỏi + dữ liệu tạm
        const [questionsData, tempData] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/api/questions?lessonId=${lessonId}`).then(
            (res) => res.json()
          ),
          fetch(
            `${process.env.REACT_APP_API_URL}/api/temp/load?userId=${userId}&lessonId=${lessonId}`
          ).then((res) => (res.ok ? res.json() : [])),
        ]);

        setQuestions(questionsData);

        const tempMap = Array.isArray(tempData)
          ? Object.fromEntries(tempData.map((t) => [t.questionId, t.code]))
          : {};

        if (questionsData.length > 0) {
          setCurrent(questionsData[0]);
          setEditorStates(
            Object.fromEntries(
              questionsData.map((q) => [
                q.id,
                { code: tempMap[q.id] || q.defaultCode || "", result: "" },
              ])
            )
          );
        }

        // ✅ Bổ sung courseId nếu thiếu
        if (!lessonData.courseId && questionsData.length > 0) {
          const inferredCourseId = questionsData[0].courseId || null;
          setLesson({ ...lessonData, courseId: inferredCourseId });
        }
      } catch (err) {
        console.error("❌ Lỗi load dữ liệu bài học hoặc câu hỏi:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [lessonId, userId]);

  return {
    lesson,
    questions,
    current,
    setCurrent,
    editorStates,
    setEditorStates,
    loading,
  };
}
