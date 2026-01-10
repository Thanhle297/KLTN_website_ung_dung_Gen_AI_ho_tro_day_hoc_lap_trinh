// useLessonQuestions.js
import { useEffect, useMemo, useState, useCallback } from "react";

function safeJson(res) {
  return res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`));
}

export default function useLessonQuestions(lessonId, userId) {
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(null);

  // editorStates: { [questionId]: { code, results, guide, status, hasNewGuide } }
  const [editorStates, setEditorStates] = useState({});
  const [loading, setLoading] = useState(true);

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL, []);

  const updateEditorState = useCallback((questionId, patch) => {
    if (!questionId) return;
    setEditorStates((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {
          code: "",
          results: [],
          guide: null,
          status: null,
          hasNewGuide: false,
        }),
        ...patch,
      },
    }));
  }, []);

  useEffect(() => {
    if (!lessonId || !userId) return;

    const controller = new AbortController();

    async function loadAll() {
      setLoading(true);
      try {
        // 1) Load lesson + questions + temp in parallel
        const [lessonData, questionsData, tempData] = await Promise.all([
          fetch(`${apiBase}/api/lessons/detail/${lessonId}`, {
            signal: controller.signal,
          }).then(safeJson),
          fetch(`${apiBase}/api/questions?lessonId=${lessonId}`, {
            signal: controller.signal,
          }).then(safeJson),
          fetch(
            `${apiBase}/api/temp/load?userId=${userId}&lessonId=${lessonId}`,
            { signal: controller.signal }
          )
            .then((res) => (res.ok ? res.json() : {}))
            .catch(() => ({})),
        ]);

        setLesson(lessonData);
        setQuestions(Array.isArray(questionsData) ? questionsData : []);

        const qList = Array.isArray(questionsData) ? questionsData : [];
        const tempMap =
          tempData && typeof tempData === "object" ? tempData : {};

        // 2) Build editorStates merged: temp ưu tiên, fallback defaultCode
        const mergedStates = {};
        for (const q of qList) {
          const qid = q?.id;
          if (!qid) continue;

          const temp = tempMap[qid];
          mergedStates[qid] = {
            code: (temp?.code ?? q?.defaultCode ?? "").toString(),
            results: Array.isArray(temp?.results) ? temp.results : [],
            guide: temp?.guide ?? null,
            status: temp?.status ?? null,
            hasNewGuide: !!temp?.hasNewGuide,
          };
        }
        setEditorStates(mergedStates);

        // 3) Set current question
        if (qList.length > 0) setCurrent(qList[0]);

        // 4) If lesson missing courseId, infer from first question (optional)
        if (lessonData && !lessonData.courseId && qList.length > 0) {
          const inferredCourseId = qList[0]?.courseId || null;
          setLesson({ ...lessonData, courseId: inferredCourseId });
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("❌ Lỗi load bài học/câu hỏi/temp:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAll();
    return () => controller.abort();
  }, [apiBase, lessonId, userId]);

  return {
    lesson,
    questions,
    current,
    setCurrent,
    editorStates,
    setEditorStates,
    updateEditorState,
    loading,
  };
}
