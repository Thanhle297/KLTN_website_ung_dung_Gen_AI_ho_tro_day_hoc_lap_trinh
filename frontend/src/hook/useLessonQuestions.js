// useLessonQuestions.js
import { useEffect, useMemo, useState, useCallback } from "react";

function safeJson(res) {
  return res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`));
}

export default function useLessonQuestions(lessonId, userId, courseId) {
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(null);

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
        const cQuery = courseId ? `&courseId=${courseId}` : "";
        const [lessonData, questionsData, tempData] = await Promise.all([
          fetch(
            `${apiBase}/api/lessons/detail/${lessonId}?${cQuery.replace(
              "&",
              ""
            )}`,
            {
              signal: controller.signal,
            }
          ).then(safeJson),
          fetch(`${apiBase}/api/questions?lessonId=${lessonId}${cQuery}`, {
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
        if (qList.length > 0) setCurrent(qList[0]);

        let finalLesson = lessonData;
        if (
          lessonData &&
          !lessonData.courseId &&
          lessonData.parentLesson?.lessonId
        ) {
          const pQuery = courseId ? `?courseId=${courseId}` : "";
          const parentRes = await fetch(
            `${apiBase}/api/lessons/${lessonData.parentLesson.lessonId}${pQuery}`,
            { signal: controller.signal }
          );
          const parentLesson = await safeJson(parentRes);
          finalLesson = { ...lessonData, courseId: parentLesson.courseId };
        }
        setLesson(finalLesson);
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
  }, [apiBase, lessonId, userId, courseId]);

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
