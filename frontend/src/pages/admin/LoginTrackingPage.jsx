import React, { useState, useEffect, useCallback } from "react";
import { Typography, Box, CircularProgress } from "@mui/material";
import { History } from "@mui/icons-material";
import AdminPageCard from "../../components/admin/AdminPageCard";
import LoginFilterBar from "../../components/admin/login-tracking/LoginFilterBar";
import LoginStatsCards from "../../components/admin/login-tracking/LoginStatsCards";
import LoginChart from "../../components/admin/login-tracking/LoginChart";
import LoginSessionsTable from "../../components/admin/login-tracking/LoginSessionsTable";
import UserSessionDialog from "../../components/admin/login-tracking/UserSessionDialog";
import useAdminAPI from "../../hook/useAdminAPI";

export default function LoginTrackingPage() {
  const api = useAdminAPI();

  // Filter state
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState("day");
  const [page, setPage] = useState(1);

  // Data state
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load thống kê tổng quan + biểu đồ
  const loadStats = useCallback(async () => {
    try {
      const params = { period };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.getSessionStats(params);
      setStats(res.data);
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    }
  }, [api, period, dateFrom, dateTo]);

  // Load danh sách sessions
  const loadSessions = useCallback(async () => {
    try {
      const params = { page, limit: 15 };
      if (debouncedSearch) params.username = debouncedSearch;
      if (role) params.role = role;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.getLoginSessions(params);
      setSessions(res.data.sessions);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Lỗi tải sessions:", err);
    }
  }, [api, page, debouncedSearch, role, dateFrom, dateTo]);

  // Load lần đầu và khi filter thay đổi
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadSessions()]);
      setLoading(false);
    };
    load();
  }, [loadStats, loadSessions]);

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, dateFrom, dateTo]);

  // Mở dialog chi tiết user
  const handleViewUser = useCallback((session) => {
    setSelectedUser(session);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedUser(null);
  }, []);

  if (loading && !stats) {
    return (
      <AdminPageCard>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      </AdminPageCard>
    );
  }

  return (
    <AdminPageCard>
      {/* Tiêu đề */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <History
          sx={{
            fontSize: 32,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Lịch sử đăng nhập
        </Typography>
      </Box>

      {/* Bộ lọc */}
      <LoginFilterBar
        search={search}
        onSearchChange={setSearch}
        role={role}
        onRoleChange={setRole}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Cards thống kê */}
      <LoginStatsCards overview={stats?.overview || {}} />

      {/* Biểu đồ */}
      <LoginChart chartData={stats?.chartData || []} period={period} />

      {/* Bảng sessions */}
      <LoginSessionsTable
        sessions={sessions}
        pagination={pagination}
        onPageChange={setPage}
        onViewUser={handleViewUser}
      />

      {/* Dialog chi tiết user */}
      <UserSessionDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        user={selectedUser}
      />
    </AdminPageCard>
  );
}
