import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import useAdminAPI from "../../../hook/useAdminAPI";

const DistributeModal = ({ open, onClose, selectedQuestionIds, onSuccess }) => {
  const api = useAdminAPI();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [subLessons, setSubLessons] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedSubLesson, setSelectedSubLesson] = useState("");

  const [loading, setLoading] = useState(false);

  // Load Courses on Open
  useEffect(() => {
    if (open) {
      const fetchCourses = async () => {
        try {
          const res = await api.getCourses();
          setCourses(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchCourses();
    }
  }, [open, api]);

  // Load Lessons when Course changes
  useEffect(() => {
    if (selectedCourse) {
      const fetchLessons = async () => {
        try {
          const res = await api.getLessonsByCourse(selectedCourse);
          setLessons(res.data);
          setSelectedLesson("");
          setSelectedSubLesson("");
        } catch (err) {
          console.error(err);
        }
      };
      fetchLessons();
    } else {
      setLessons([]);
    }
  }, [selectedCourse, api]);

  // Load SubLessons when Lesson changes
  useEffect(() => {
    if (selectedLesson) {
      const fetchSub = async () => {
        try {
          const res = await api.getSubLessons(selectedLesson);
          setSubLessons(res.data);
          setSelectedSubLesson("");
        } catch (err) {
          console.error(err);
        }
      };
      fetchSub();
    } else {
      setSubLessons([]);
    }
  }, [selectedLesson, api]);

  const handleConfirm = async () => {
    if (!selectedSubLesson || selectedQuestionIds.length === 0) return;

    try {
      setLoading(true);
      await api.assignQuestionsToLesson(selectedQuestionIds, selectedSubLesson);
      onSuccess();
      onClose();
    } catch (err) {
      alert("Lỗi phân phối câu hỏi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        Phân phối {selectedQuestionIds.length} câu hỏi
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Chọn Khóa học</InputLabel>
            <Select
              value={selectedCourse}
              label="Chọn Khóa học"
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.map((c) => (
                <MenuItem key={c.courseId} value={c.courseId}>
                  {c.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={!selectedCourse}>
            <InputLabel>Chọn Bài học</InputLabel>
            <Select
              value={selectedLesson}
              label="Chọn Bài học"
              onChange={(e) => setSelectedLesson(e.target.value)}
            >
              {lessons.map((l) => (
                <MenuItem key={l.lessonId} value={l.lessonId}>
                  {l.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={!selectedLesson}>
            <InputLabel>Chọn SubLesson (Đích)</InputLabel>
            <Select
              value={selectedSubLesson}
              label="Chọn SubLesson (Đích)"
              onChange={(e) => setSelectedSubLesson(e.target.value)}
            >
              {subLessons.map((s) => (
                <MenuItem key={s.lessonId} value={s.lessonId}>
                  {s.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedSubLesson && (
            <Typography variant="body2" color="primary">
              Sẽ sao chép {selectedQuestionIds.length} câu hỏi vào bài học này.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selectedSubLesson || loading}
        >
          {loading ? "Đang xử lý..." : "Xác nhận"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DistributeModal;
