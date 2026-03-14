import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Avatar,
  Pagination,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  Divider,
  Paper,
} from "@mui/material";
import {
  Login as LoginIcon,
  Timer,
  CalendarMonth,
  TrendingUp,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useAdminAPI from "../../../hook/useAdminAPI";

// Helper: format ngày giờ
const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper: format thời lượng
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}p`;
  if (m > 0) return `${m}p ${s}s`;
  return `${s}s`;
};

// Map logoutType
const LOGOUT_TYPE_MAP = {
  manual: { label: "Chủ động", color: "success" },
  timeout: { label: "Hết phiên", color: "warning" },
  token_expired: { label: "Token hết hạn", color: "error" },
};

// Format chart data
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
    return { label, "Lượt đăng nhập": item.count };
  });
};

// Helper: lấy initials
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const UserSessionDialog = ({ open, onClose, user }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const api = useAdminAPI();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState("day");

  const loadData = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const res = await api.getUserSessions(user.userId, {
        page,
        limit: 10,
        period,
      });
      setData(res.data);
    } catch (err) {
      console.error("Lỗi tải lịch sử user:", err);
    } finally {
      setLoading(false);
    }
  }, [api, user?.userId, page, period]);

  useEffect(() => {
    if (open && user) {
      setPage(1);
      loadData();
    }
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [page, period]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const stats = data?.stats || {};
  const sessions = data?.sessions || [];
  const chartData = formatChartData(data?.chartData || [], period);
  const pagination = data?.pagination || {};

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 48,
              height: 48,
              fontWeight: 700,
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {getInitials(user.fullname)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {user.fullname}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, fontFamily: "monospace" }}
            >
              {user.username}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {loading && !data ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 300,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Thống kê tổng quan */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
              {[
                {
                  icon: <LoginIcon />,
                  label: "Tổng lượt",
                  value: stats.totalLogins || 0,
                  gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                },
                {
                  icon: <Timer />,
                  label: "TB thời gian",
                  value: formatDuration(stats.avgDuration || 0),
                  gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                },
                {
                  icon: <CalendarMonth />,
                  label: "Lần cuối",
                  value: stats.lastLogin
                    ? new Date(stats.lastLogin).toLocaleDateString("vi-VN")
                    : "—",
                  gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                },
                {
                  icon: <TrendingUp />,
                  label: "Tổng online",
                  value: formatDuration(stats.totalDuration || 0),
                  gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                },
              ].map(({ icon, label, value, gradient }, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    flex: "1 1 120px",
                    minWidth: 120,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        background: gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {React.cloneElement(icon, {
                        sx: { color: "white", fontSize: 18 },
                      })}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
                    >
                      {label}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {value}
                  </Typography>
                </Paper>
              ))}
            </Stack>

            {/* Toggle period + Biểu đồ */}
            <Box sx={{ mb: 2 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Biểu đồ đăng nhập
                </Typography>
                <ToggleButtonGroup
                  value={period}
                  exclusive
                  onChange={(_, val) => val && setPeriod(val)}
                  size="small"
                >
                  <ToggleButton value="day" sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                    Ngày
                  </ToggleButton>
                  <ToggleButton value="week" sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                    Tuần
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {chartData.length === 0 ? (
                <Box
                  sx={{
                    height: 150,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "rgba(255,255,255,0.1)" : "#eee"}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="Lượt đăng nhập"
                      fill="url(#colorLoginDialog)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <defs>
                      <linearGradient id="colorLoginDialog" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Bảng lịch sử chi tiết */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Chi tiết từng phiên
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                      Đăng nhập
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                      Đăng xuất
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                      Thời lượng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                      Loại
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                      IP
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có dữ liệu
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((s) => {
                      const logoutConf = LOGOUT_TYPE_MAP[s.logoutType];
                      const online =
                        !s.logoutAt && new Date(s.tokenExpiry) > new Date();
                      return (
                        <TableRow key={s._id} hover>
                          <TableCell sx={{ fontSize: "0.8rem" }}>
                            {formatDateTime(s.loginAt)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8rem" }}>
                            {online ? (
                              <Chip
                                label="Online"
                                color="success"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            ) : (
                              formatDateTime(s.logoutAt)
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: isDark ? "#4facfe" : "#3182ce",
                            }}
                          >
                            {online ? "Đang hoạt động" : formatDuration(s.duration)}
                          </TableCell>
                          <TableCell>
                            {logoutConf ? (
                              <Chip
                                label={logoutConf.label}
                                color={logoutConf.color}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: "monospace",
                                backgroundColor: isDark
                                  ? "rgba(255,255,255,0.05)"
                                  : "#f5f5f5",
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                              }}
                            >
                              {s.ipAddress || "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                  shape="rounded"
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(UserSessionDialog);
