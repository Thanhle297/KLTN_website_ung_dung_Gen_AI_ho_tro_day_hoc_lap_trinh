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

const LessonsHeader = React.memo(
  ({
    courses,
    selectedCourse,
    onCourseChange,
    filterDisplay,
    onFilterChange,
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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            📚 Quản lý Bài học
          </Typography>

          <Stack
            direction="row"
            gap={1.5}
            justifyContent="flex-end"
            sx={{ flexWrap: "wrap" }}
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Khóa học</InputLabel>
              <Select
                label="Khóa học"
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

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Hiển thị</InputLabel>
              <Select
                label="Hiển thị"
                value={filterDisplay}
                onChange={(e) => onFilterChange(e.target.value)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: "white",
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="true">Đang hiển thị</MenuItem>
                <MenuItem value="false">Đang ẩn</MenuItem>
              </Select>
            </FormControl>

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
              Thêm bài học
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }
);

LessonsHeader.displayName = "LessonsHeader";

export default LessonsHeader;
