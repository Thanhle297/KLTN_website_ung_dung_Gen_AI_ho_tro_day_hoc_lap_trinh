import React from "react";
import { Grid, Paper, Typography, Box, useTheme } from "@mui/material";
import {
  Login as LoginIcon,
  Today,
  PeopleAlt,
  Timer,
} from "@mui/icons-material";

// Helper: format giây thành "Xh Yp"
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0p";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}p`;
  return `${m}p`;
};

const CARDS = [
  {
    key: "totalSessions",
    label: "Tổng lượt đăng nhập",
    icon: LoginIcon,
    color: "primary",
  },
  {
    key: "todayCount",
    label: "Hôm nay",
    icon: Today,
    color: "danger",
  },
  {
    key: "onlineCount",
    label: "Đang online",
    icon: PeopleAlt,
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    key: "avgDuration",
    label: "TB thời gian/phiên",
    icon: Timer,
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    format: formatDuration,
  },
];

const LoginStatsCards = ({ overview = {} }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gradients = {
    primary: theme.palette.gradient.primary,
    danger: theme.palette.gradient.danger,
    online: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    duration: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {CARDS.map(({ key, label, icon: Icon, color, gradient, format }) => (
        <Grid key={key} size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              // borderRadius: 0,
              background: isDark
                ? theme.palette.background.paper
                : "white",
              border: `1px solid ${theme.palette.divider}`,
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              },
            }}
          >
            {/* Gradient accent bar */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: gradient || gradients[color],
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: gradient || gradients[color],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ color: "white", fontSize: 26 }} />
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontSize: "0.7rem",
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, lineHeight: 1.2 }}
                >
                  {format
                    ? format(overview[key] || 0)
                    : (overview[key] ?? 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default React.memo(LoginStatsCards);
