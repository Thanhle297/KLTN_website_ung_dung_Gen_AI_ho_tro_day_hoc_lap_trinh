import React, { useState, useEffect, useCallback } from "react";
import { History } from "@mui/icons-material";
import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import AdminTableSkeleton from "../../components/admin/shared/AdminTableSkeleton";
import LoginFilterBar from "../../components/admin/login-tracking/LoginFilterBar";
import LoginStatsCards from "../../components/admin/login-tracking/LoginStatsCards";
import LoginChart from "../../components/admin/login-tracking/LoginChart";
import LoginSessionsTable from "../../components/admin/login-tracking/LoginSessionsTable";
import UserSessionDialog from "../../components/admin/login-tracking/UserSessionDialog";
import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";

export default function LoginTrackingPage() {
  const api = useAdminAPI();
  const notify = useNotify();

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
      notify.error("Lỗi tải thống kê");
    }
  }, [api, notify, period, dateFrom, dateTo]);

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
      notify.error("Lỗi tải sessions");
    }
  }, [api, notify, page, debouncedSearch, role, dateFrom, dateTo]);

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
      <AdminPageWrapper>
        <AdminPageHeader icon={<History />} title="Lịch sử đăng nhập" />
        <AdminTableSkeleton rows={8} columns={5} />
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      {/* Tiêu đề */}
      <AdminPageHeader icon={<History />} title="Lịch sử đăng nhập" />

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
    </AdminPageWrapper>
  );
}
