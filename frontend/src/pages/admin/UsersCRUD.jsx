import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
} from "@mui/material";

import useAdminAPI from "../../hook/useAdminAPI";

// Import các component con
import UserTableHeader from "../../components/admin/users/UserTableHeader";
import UserSearchBar from "../../components/admin/users/UserSearchBar";
import UserTableRow from "../../components/admin/users/UserTableRow";
import UserFormDialog from "../../components/admin/users/UserFormDialog";
import ChangePasswordDialog from "../../components/admin/users/ChangePasswordDialog";
import DeleteConfirmDialog from "../../components/admin/users/DeleteConfirmDialog";
import UserNotification from "../../components/admin/users/UserNotification";

export default function UsersCRUD() {
  const api = useAdminAPI();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [search, setSearch] = useState("");
  const [openPassDialog, setOpenPassDialog] = useState(false);
  const [passForm, setPassForm] = useState({ userId: "", newPassword: "" });

  // Delete confirmation dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    fullname: "",
    role: "user",
    isActive: true,
  });

  const [snack, setSnack] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showMessage = useCallback((message, severity = "success") => {
    setSnack({ open: true, message, severity });
  }, []);

  const handleCloseSnack = useCallback(() => {
    setSnack((s) => ({ ...s, open: false }));
  }, []);

  /* ============================== LOAD USERS ============================== */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.data);
    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Lỗi tải user",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadUsers();
  }, []);

  /* ============================== PAGINATION HANDLERS ============================== */
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  /* ============================== SEARCH HANDLER ============================== */
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0); // Reset page on search
  }, []);

  /* ============================== FORM HANDLERS ============================== */
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

  /* ============================== SAVE (CREATE / UPDATE) ============================== */
  const handleSave = useCallback(async () => {
    try {
      if (!form.email || !form.username || (!editingUser && !form.password)) {
        setSnack({
          open: true,
          message: "Email, Username và Password (khi tạo) là bắt buộc",
          severity: "warning",
        });
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
        setSnack({
          open: true,
          message: "Cập nhật user thành công",
          severity: "success",
        });
      } else {
        await api.createUser({
          email: form.email,
          username: form.username,
          password: form.password,
          fullname: form.fullname,
          role: form.role,
          isActive: form.isActive,
        });
        setSnack({
          open: true,
          message: "Tạo user mới thành công",
          severity: "success",
        });
      }

      setOpenDialog(false);
      loadUsers();
    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Lỗi lưu user",
        severity: "error",
      });
    }
  }, [form, editingUser, api, loadUsers]);

  /* ============================== DELETE ============================== */
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
      setSnack({
        open: true,
        message: "Xóa user thành công",
        severity: "success",
      });
      setOpenDeleteDialog(false);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Lỗi xóa user",
        severity: "error",
      });
    }
  }, [deletingUser, api, loadUsers]);

  /* ============================== CHANGE PASSWORD ============================== */
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
        setSnack({
          open: true,
          message: "Vui lòng nhập mật khẩu mới",
          severity: "warning",
        });
        return;
      }
      await api.adminChangePassword(passForm.userId, passForm.newPassword);
      setSnack({
        open: true,
        message: "Đổi mật khẩu thành công",
        severity: "success",
      });
      setOpenPassDialog(false);
    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Lỗi đổi mật khẩu",
        severity: "error",
      });
    }
  }, [passForm, api]);

  /* ============================== RENDER ============================== */
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination Logic
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
        overflowX: "hidden",
      }}
    >
      {/* Header Section */}
      <UserTableHeader onAddUser={openCreateDialog} />

      {/* Search Bar */}
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
        <UserSearchBar value={search} onChange={handleSearchChange} />
      </Box>

      {/* Users Table */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress
            size={60}
            sx={{
              color: "white",
            }}
          />
        </Box>
      ) : (
        <Paper
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user, index) => (
                  <UserTableRow
                    key={user._id}
                    user={user}
                    index={index}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                    onChangePassword={openChangePass}
                  />
                ))}

                {paginatedUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="h6" color="text.secondary">
                        😔 Không tìm thấy user nào
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
              borderTop: "1px solid rgba(224, 224, 224, 1)",
            }}
          />
        </Paper>
      )}

      {/* Dialog thêm / sửa */}
      <UserFormDialog
        open={openDialog}
        editingUser={editingUser}
        form={form}
        onClose={handleCloseDialog}
        onSave={handleSave}
        onFormChange={handleFormChange}
      />

      {/* Dialog Đổi mật khẩu */}
      <ChangePasswordDialog
        open={openPassDialog}
        password={passForm.newPassword}
        onClose={handleClosePassDialog}
        onSave={handleChangePass}
        onPasswordChange={handlePasswordChange}
      />

      {/* Dialog Xác nhận xóa */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        user={deletingUser}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />

      {/* Snackbar thông báo */}
      <UserNotification
        open={snack.open}
        message={snack.message}
        severity={snack.severity}
        onClose={handleCloseSnack}
      />
    </Box>
  );
}
