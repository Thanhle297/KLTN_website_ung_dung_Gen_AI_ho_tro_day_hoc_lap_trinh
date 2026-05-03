import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Chip,
  useTheme,
} from "@mui/material";
import {
  People,
  School,
  History,
  Quiz,
  PersonAdd,
  LibraryBooks,
  HelpOutline,
  GroupAdd,
  Dashboard,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";
import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import {
  statCardSx,
  iconCircleSx,
  adminSectionSx,
} from "../../styles/adminTokens";

export default function AdminHome() {
  const api = useAdminAPI();
  const theme = useTheme();
  const navigate = useNavigate();
  const notify = useNotify();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setData(res.data);
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
      notify.error("Lỗi tải thống kê tổng quan");
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Cấu hình 4 stat cards
  const stats = useMemo(
    () => data
      ? [
        {
          label: "Người dùng",
          value: data.totalUsers,
          icon: <People />,
          color: theme.palette.primary.main,
        },
        {
          label: "Khóa học",
          value: data.totalCourses,
          icon: <School />,
          color: theme.palette.info.main,
        },
        {
          label: "Phiên hôm nay",
          value: data.todaySessions,
          icon: <History />,
          color: theme.palette.secondary.main,
        },
        {
          label: "Câu hỏi",
          value: data.totalQuestions,
          icon: <Quiz />,
          color: theme.palette.warning.main,
        },
      ]
      : [],
    [data, theme]
  );

  // Quick actions
  const quickActions = [
    {
      label: "Quản lý người dùng",
      icon: <PersonAdd />,
      path: "/admin/users",
    },
    {
      label: "Quản lý khóa học",
      icon: <LibraryBooks />,
      path: "/admin/courses",
    },
    {
      label: "Quản lý câu hỏi",
      icon: <HelpOutline />,
      path: "/admin/questions",
    },
    {
      label: "Ghi danh học viên",
      icon: <GroupAdd />,
      path: "/admin/enrollments",
    },
  ];

  // Tìm giá trị lớn nhất trong loginChart để tính tỷ lệ cột
  const loginChart = data?.loginChart || [];
  const maxCount = Math.max(...loginChart.map((d) => Number(d.count) || 0), 1);
  const hasLoginData = loginChart.some((item) => Number(item.count) > 0);

  return (
    <AdminPageWrapper>
      <AdminPageHeader
        icon={<Dashboard />}
        title="Tổng quan hệ thống"
        subtitle="Bảng điều khiển quản trị"
      />

      {/* ===== STAT CARDS ===== */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Skeleton
                  variant="rounded"
                  height={100}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))
          : stats.map((stat) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                <Paper sx={statCardSx(theme)}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{ ...iconCircleSx(theme), background: stat.color }}
                    >
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={700}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
      </Grid>

      {/* ===== BIỂU ĐỒ LOGIN + QUICK ACTIONS ===== */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Biểu đồ login 7 ngày */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={adminSectionSx(theme)}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Lượt đăng nhập 7 ngày gần đây
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={200} />
            ) : loginChart.length > 0 ? (
              <Stack
                direction="row"
                spacing={1}
                alignItems="flex-end"
                sx={{ height: 200, px: 1 }}
              >
                {loginChart.map((item) => (
                  <Stack
                    key={item.date}
                    alignItems="center"
                    spacing={0.5}
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    <Typography variant="caption" fontWeight={600}>
                      {Number(item.count) || 0}
                    </Typography>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: 48,
                        height: `${hasLoginData ? Math.max(((Number(item.count) || 0) / maxCount) * 160, 8) : 8}px`,
                        opacity: hasLoginData ? 1 : 0.45,
                        borderRadius: "6px 6px 2px 2px",
                        background: theme.palette.gradient.primary,
                        transition: "height 0.4s ease",
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                    >
                      {item.date}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ py: 4 }} align="center">
                Chưa có dữ liệu đăng nhập
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={adminSectionSx(theme)}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Truy cập nhanh
            </Typography>
            <Stack spacing={1.5}>
              {quickActions.map((action) => (
                <Button
                  key={action.path}
                  variant="outlined"
                  startIcon={action.icon}
                  onClick={() => navigate(action.path)}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    fontWeight: 500,
                    py: 1.2,
                  }}
                  fullWidth
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ===== HOẠT ĐỘNG GẦN ĐÂY ===== */}
      <Paper sx={adminSectionSx(theme)}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Hoạt động gần đây
        </Typography>
        {loading ? (
          <Skeleton variant="rounded" height={200} />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Họ tên</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.recentSessions?.length > 0 ? (
                  data.recentSessions.map((session, idx) => (
                    <TableRow key={session._id || idx}>
                      <TableCell>{session.username}</TableCell>
                      <TableCell>{session.fullname || "—"}</TableCell>
                      <TableCell>
                        {session.loginTime || session.loginAt
                          ? new Date(session.loginTime || session.loginAt).toLocaleString("vi-VN")
                          : "—"}
                      </TableCell>
                      <TableCell>{session.ip || session.ipAddress || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={session.logoutTime || session.logoutAt ? "Đã thoát" : "Đang hoạt động"}
                          color={session.logoutTime || session.logoutAt ? "default" : "success"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        Chưa có phiên đăng nhập nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </AdminPageWrapper>
  );
}
