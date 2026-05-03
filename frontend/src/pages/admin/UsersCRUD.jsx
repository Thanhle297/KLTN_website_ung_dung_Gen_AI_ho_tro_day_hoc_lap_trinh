import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  useTheme,
} from "@mui/material";
import { People, PersonAdd } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";
import useNotify from "../../hook/useNotify";
import { adminCardSx, gradientButtonSx } from "../../styles/adminTokens";

// Import các component dùng chung
import AdminPageWrapper from "../../components/admin/shared/AdminPageWrapper";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import DeleteConfirmDialog from "../../components/admin/shared/DeleteConfirmDialog";

// Import các component riêng của trang Users
import UserSearchBar from "../../components/admin/users/UserSearchBar";
import UserTableRow from "../../components/admin/users/UserTableRow";
import UserFormDialog from "../../components/admin/users/UserFormDialog";
import ChangePasswordDialog from "../../components/admin/users/ChangePasswordDialog";
import UserCoursesDialog from "../../components/admin/users/UserCoursesDialog";

export default function UsersCRUD() {
  const api = useAdminAPI();
  const theme = useTheme();
  const notify = useNotify();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Phân trang
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [search, setSearch] = useState("");
  const [openPassDialog, setOpenPassDialog] = useState(false);
  const [passForm, setPassForm] = useState({ userId: "", newPassword: "" });

  // Bộ lọc vai trò và trạng thái
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Trạng thái dialog xác nhận xóa
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  // Trạng thái dialog quản lý khóa học
  const [openCoursesDialog, setOpenCoursesDialog] = useState(false);
  const [managingUser, setManagingUser] = useState(null);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    fullname: "",
    role: "user",
    isActive: true,
  });

  /* ============================== TẢI DANH SÁCH USERS ============================== */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.data);
    } catch (err) {
      notify.error(err.response?.data?.message || "Lỗi tải user");
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* ============================== XỬ LÝ PHÂN TRANG ============================== */
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  /* ============================== XỬ LÝ TÌM KIẾM ============================== */
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0); // Reset trang khi tìm kiếm
  }, []);

  /* ============================== XỬ LÝ FORM ============================== */
  const openCreateDialog = useCallback(() => {
    setEditingUser(null);
    setForm({
      email: "",
      username: "",
      password: "",
      fullname: "",
      role: "user",
      isActive: true,
    });
    setOpenDialog(true);
  }, []);

  const openEditDialog = useCallback((user) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      username: user.username,
      password: "",
      fullname: user.fullname,
      role: user.role,
      isActive: user.isActive,
    });
    setOpenDialog(true);
  }, []);

  const handleFormChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  /* ============================== LƯU (TẠO / CẬP NHẬT) ============================== */
  const handleSave = useCallback(async () => {
    try {
      if (!form.email || !form.username || (!editingUser && !form.password)) {
        notify.warning("Email, Username và Password (khi tạo) là bắt buộc");
        return;
      }

      if (editingUser) {
        await api.updateUser(editingUser._id, {
          email: form.email,
          fullname: form.fullname,
          username: form.username,
          role: form.role,
          isActive: form.isActive,
        });
        notify.success("Cập nhật user thành công");
      } else {
        await api.createUser({
          email: form.email,
          username: form.username,
          password: form.password,
          fullname: form.fullname,
          role: form.role,
          isActive: form.isActive,
        });
        notify.success("Tạo user mới thành công");
      }

      setOpenDialog(false);
      loadUsers();
    } catch (err) {
      notify.error(err.response?.data?.message || "Lỗi lưu user");
    }
  }, [form, editingUser, api, loadUsers, notify]);

  /* ============================== XÓA ============================== */
  const handleDelete = useCallback((user) => {
    setDeletingUser(user);
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setDeletingUser(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingUser) return;

    try {
      await api.deleteUser(deletingUser._id);
      notify.success("Xóa user thành công");
      setOpenDeleteDialog(false);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      notify.error(err.response?.data?.message || "Lỗi xóa user");
    }
  }, [deletingUser, api, loadUsers, notify]);

  /* ============================== ĐỔI MẬT KHẨU ============================== */
  const openChangePass = useCallback((user) => {
    setPassForm({ userId: user._id, newPassword: "" });
    setOpenPassDialog(true);
  }, []);

  const handleClosePassDialog = useCallback(() => {
    setOpenPassDialog(false);
  }, []);

  const handlePasswordChange = useCallback((value) => {
    setPassForm((prev) => ({ ...prev, newPassword: value }));
  }, []);

  const handleChangePass = useCallback(async () => {
    try {
      if (!passForm.newPassword) {
        notify.warning("Vui lòng nhập mật khẩu mới");
        return;
      }
      await api.adminChangePassword(passForm.userId, passForm.newPassword);
      notify.success("Đổi mật khẩu thành công");
      setOpenPassDialog(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Lỗi đổi mật khẩu");
    }
  }, [passForm, api, notify]);

  /* ============================== QUẢN LÝ KHÓA HỌC ============================== */
  const handleManageCourses = useCallback((user) => {
    setManagingUser(user);
    setOpenCoursesDialog(true);
  }, []);

  const handleCloseCoursesDialog = useCallback(() => {
    setOpenCoursesDialog(false);
    setManagingUser(null);
  }, []);

  /* ============================== LỌC & PHÂN TRANG ============================== */
  const filteredUsers = users.filter((u) => {
    const keyword = search.toLowerCase();
    const matchSearch =
      u.username.toLowerCase().includes(keyword) ||
      (u.fullname && u.fullname.toLowerCase().includes(keyword));
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  /* ============================== RENDER ============================== */
  return (
    <AdminPageWrapper>
      {/* Header với tiêu đề, nút thêm, bộ lọc và thanh tìm kiếm */}
      <AdminPageHeader
        icon={<People />}
        title="Quản lý Người dùng"
        subtitle={`Tổng cộng: ${users.length} người dùng`}
        actions={
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={openCreateDialog}
            sx={gradientButtonSx(theme)}
          >
            Thêm người dùng
          </Button>
        }
        filters={
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <UserSearchBar value={search} onChange={handleSearchChange} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                label="Vai trò"
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="teacher">Giáo viên</MenuItem>
                <MenuItem value="user">Học sinh</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                label="Trạng thái"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="locked">Bị khóa</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        }
      />

      {/* Bảng danh sách người dùng */}
      <Paper sx={adminCardSx(theme)}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                    background: theme.palette.gradient.primary,
                }}
              >
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    py: 2,
                  }}
                >
                  Người dùng
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Email
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Username
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Vai trò
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Trạng thái
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Khóa học
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : paginatedUsers.map((user, index) => (
                    <UserTableRow
                      key={user._id}
                      user={user}
                      index={index}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onChangePassword={openChangePass}
                      onManageCourses={handleManageCourses}
                    />
                  ))}

              {!loading && paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      Không tìm thấy user nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count}`
          }
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        />
      </Paper>

      {/* Dialog thêm / sửa */}
      <UserFormDialog
        open={openDialog}
        editingUser={editingUser}
        form={form}
        onClose={handleCloseDialog}
        onSave={handleSave}
        onFormChange={handleFormChange}
      />

      {/* Dialog đổi mật khẩu */}
      <ChangePasswordDialog
        open={openPassDialog}
        password={passForm.newPassword}
        onClose={handleClosePassDialog}
        onSave={handleChangePass}
        onPasswordChange={handlePasswordChange}
      />

      {/* Dialog xác nhận xóa */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        itemName={deletingUser?.fullname || deletingUser?.username || ""}
        itemType="người dùng này"
        itemDetails={
          deletingUser
            ? [
                { label: "Email", value: deletingUser.email },
                { label: "Username", value: deletingUser.username },
              ]
            : undefined
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />

      {/* Dialog quản lý khóa học */}
      <UserCoursesDialog
        open={openCoursesDialog}
        user={managingUser}
        onClose={handleCloseCoursesDialog}
        onSave={() => {
          notify.success("Cập nhật khóa học thành công");
          loadUsers();
        }}
        api={api}
      />
    </AdminPageWrapper>
  );
}
