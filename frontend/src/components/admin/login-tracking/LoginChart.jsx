import React from "react";
import { Paper, Typography, Box, useTheme } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Helper: format dữ liệu chart từ API response
const formatChartData = (chartData = [], period = "day") => {
  return chartData.map((item) => {
    let label;
    if (period === "week") {
      label = `T${item._id.week}/${item._id.year}`;
    } else {
      label = `${String(item._id.day).padStart(2, "0")}/${String(
        item._id.month
      ).padStart(2, "0")}`;
    }
    return {
      label,
      "Lượt đăng nhập": item.count,
      "Người dùng": item.uniqueUsers || 0,
    };
  });
};

// Custom tooltip cho biểu đồ
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        boxShadow: 3,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((entry, i) => (
        <Typography key={i} variant="caption" sx={{ display: "block", color: entry.color }}>
          {entry.name}: {entry.value}
        </Typography>
      ))}
    </Box>
  );
};

const LoginChart = ({ chartData = [], period = "day" }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const data = formatChartData(chartData, period);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        mb: 3,
        backgroundColor: isDark ? theme.palette.background.paper : "white",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, mb: 2, fontSize: "1rem" }}
      >
        {period === "week"
          ? "Thống kê đăng nhập theo tuần"
          : "Thống kê đăng nhập theo ngày"}
      </Typography>

      {data.length === 0 ? (
        <Box
          sx={{
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Chưa có dữ liệu
          </Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(255,255,255,0.1)" : "#eee"}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="Lượt đăng nhập"
              fill="url(#colorLogin)"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="Người dùng"
              fill="url(#colorUsers)"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
            <defs>
              <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#43e97b" />
                <stop offset="100%" stopColor="#38f9d7" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
};

export default React.memo(LoginChart);
