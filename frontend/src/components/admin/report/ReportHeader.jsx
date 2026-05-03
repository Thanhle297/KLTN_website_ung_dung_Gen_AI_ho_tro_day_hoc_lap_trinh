// components/admin/report/ReportHeader.jsx
// Breadcrumb + nút quay lại cho trang Báo cáo điểm
import React from "react";
import {
  Box,
  Button,
  Breadcrumbs,
  Link,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

/**
 * @param {object}   props
 * @param {Function} props.navigate   - react-router navigate
 */
const ReportHeader = ({ navigate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const textColor = isDark ? theme.palette.text.primary : "white";

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 1, color: textColor }}
        >
          <Link
            underline="hover"
            sx={{
              display: "flex",
              alignItems: "center",
              color: textColor,
              cursor: "pointer",
            }}
            onClick={() => navigate("/admin/courses")}
          >
            <SchoolIcon sx={{ mr: 0.5 }} fontSize="small" />
            Quản lý Khóa học
          </Link>
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              color: textColor,
            }}
          >
            <AssessmentIcon sx={{ mr: 0.5 }} fontSize="small" />
            Báo cáo điểm
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/courses")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: textColor,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(255, 255, 255, 0.25)",
              },
            }}
          >
            Quay lại
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

ReportHeader.displayName = "ReportHeader";

export default React.memo(ReportHeader);
