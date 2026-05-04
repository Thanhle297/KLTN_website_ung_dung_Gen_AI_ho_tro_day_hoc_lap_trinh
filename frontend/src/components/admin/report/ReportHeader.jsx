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
  // Header nằm trên nền trang admin (sáng ở light mode, tối ở dark mode)
  // → dùng text.primary để luôn tương phản với nền.
  const textColor = theme.palette.text.primary;
  const linkHoverColor = theme.palette.primary.main;

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
              "&:hover": { color: linkHoverColor },
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
              fontWeight: 600,
            }}
          >
            <AssessmentIcon sx={{ mr: 0.5 }} fontSize="small" />
            Báo cáo điểm
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/courses")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: textColor,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.15)",
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.04)"
                : "rgba(0, 0, 0, 0.02)",
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.06)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.35)"
                  : "rgba(0, 0, 0, 0.3)",
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
