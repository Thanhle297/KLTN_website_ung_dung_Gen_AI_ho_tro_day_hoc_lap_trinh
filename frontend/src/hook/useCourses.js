// hooks/useCourses.js
import { useState, useEffect } from "react";

export default function useCourses(apiUrl, fallbackCourses = []) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiUrl) {
      setCourses(fallbackCourses);
      setLoading(false);
      return;
    }

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch(() => setCourses(fallbackCourses))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  return { courses, loading };
}
