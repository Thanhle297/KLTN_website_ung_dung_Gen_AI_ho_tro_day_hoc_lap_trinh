import React from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const SubLessonsHeader = React.memo(
  ({
    courses,
    selectedCourse,
    onCourseChange,
    lessonList,
    selectedLesson,
    onLessonChange,
    onAddClick,
  }) => {
    return (
      <Box
        sx={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: 4,
          p: 3,
          mb: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 3,
          }}
        >
          📖 Quản lý SubLesson
        </Typography>

        {/* Chọn Khóa học */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Chọn Khóa học</InputLabel>
          <Select
            label="Chọn Khóa học"
            value={selectedCourse}
            onChange={(e) => onCourseChange(e.target.value)}
            sx={{
              borderRadius: 2,
              backgroundColor: "white",
            }}
          >
            {courses?.map((c) => (
              <MenuItem key={c.courseId} value={c.courseId}>
                {c.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Chọn bài lớn */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Chọn Bài học</InputLabel>
          <Select
            label="Chọn Bài học"
            value={selectedLesson}
            onChange={(e) => onLessonChange(e.target.value)}
            sx={{
              borderRadius: 2,
              backgroundColor: "white",
            }}
          >
            {lessonList.map((l) => (
              <MenuItem key={l.lessonId} value={l.lessonId}>
                {l.lessonId} — {l.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedLesson && (
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={onAddClick}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                px: 3,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Thêm SubLesson
            </Button>
          </Stack>
        )}
      </Box>
    );
  }
);

SubLessonsHeader.displayName = "SubLessonsHeader";

export default SubLessonsHeader;
