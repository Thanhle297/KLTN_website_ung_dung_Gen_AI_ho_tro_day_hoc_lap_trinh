import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { Add } from "@mui/icons-material";

const CoursesHeader = React.memo(({ onAddClick }) => {
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
          📚 Quản lý Khóa học
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
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
              background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
            },
            transition: "all 0.3s ease",
          }}
        >
          Thêm khóa học
        </Button>
      </Stack>
    </Box>
  );
});

CoursesHeader.displayName = "CoursesHeader";

export default CoursesHeader;
