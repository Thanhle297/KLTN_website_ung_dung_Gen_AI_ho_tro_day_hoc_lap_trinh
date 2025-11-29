import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { Edit, Delete, Key, Search } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";

export default function UsersCRUD() {
  const api = useAdminAPI();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [search, setSearch] = useState("");
  const [openPassDialog, setOpenPassDialog] = useState(false);
  const [passForm, setPassForm] = useState({ userId: "", newPassword: "" });

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

  const showMessage = (message, severity = "success") => {
    setSnack({ open: true, message, severity });
  };
  const handleCloseSnack = () => setSnack((s) => ({ ...s, open: false }));

  /* ============================== LOAD USERS ============================== */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.data);
    } catch (err) {
      showMessage(err.response?.data?.message || "Lỗi tải user", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ============================== FORM HANDLERS ============================== */
  const openCreateDialog = () => {
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
  };

  const openEditDialog = (user) => {
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
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ============================== SAVE (CREATE / UPDATE) ============================== */
  const handleSave = async () => {
    try {
      if (!form.email || !form.username || (!editingUser && !form.password)) {
        showMessage(
          "Email, Username và Password (khi tạo) là bắt buộc",
          "warning"
        );
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
        showMessage("Cập nhật user thành công");
      } else {
        await api.createUser({
          email: form.email,
          username: form.username,
          password: form.password,
          fullname: form.fullname,
          role: form.role,
          isActive: form.isActive,
        });
        showMessage("Tạo user mới thành công");
      }

      setOpenDialog(false);
      loadUsers();
    } catch (err) {
      showMessage(err.response?.data?.message || "Lỗi lưu user", "error");
    }
  };

  /* ============================== DELETE ============================== */
  const handleDelete = async (user) => {
    if (!window.confirm(`Xóa user: ${user.email}?`)) return;

    try {
      await api.deleteUser(user._id);
      showMessage("Xóa user thành công");
      loadUsers();
    } catch (err) {
      showMessage(err.response?.data?.message || "Lỗi xóa user", "error");
    }
  };

  /* ============================== CHANGE PASSWORD ============================== */
  const openChangePass = (user) => {
    setPassForm({ userId: user._id, newPassword: "" });
    setOpenPassDialog(true);
  };

  const handleChangePass = async () => {
    try {
      if (!passForm.newPassword) {
        showMessage("Vui lòng nhập mật khẩu mới", "warning");
        return;
      }
      await api.adminChangePassword(passForm.userId, passForm.newPassword);
      showMessage("Đổi mật khẩu thành công");
      setOpenPassDialog(false);
    } catch (err) {
      showMessage(err.response?.data?.message || "Lỗi đổi mật khẩu", "error");
    }
  };

  /* ============================== RENDER ============================== */
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  /* ============================== RENDER ============================== */
  return (
    <Box>
      <Box
        sx={{
          position: "sticky",
          top: 64,
          zIndex: 10,
          backgroundColor: "#f4f6f8",
          pb: 1,
          pt: 1,
          mx: -3,
          px: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between" mb={2}>
          <Typography variant="h5">Quản lý User</Typography>
          <Button variant="contained" onClick={openCreateDialog}>
            Thêm User
          </Button>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Tìm kiếm theo username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fullname</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Kích hoạt</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u._id}>
                <TableCell>{u.fullname}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.isActive ? "Hoạt động" : "Khóa"}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => openChangePass(u)}
                    title="Đổi mật khẩu"
                    color="warning"
                  >
                    <Key />
                  </IconButton>
                  <IconButton onClick={() => openEditDialog(u)} title="Sửa">
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(u)}
                    title="Xóa"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có user nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Dialog thêm / sửa */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? "Chỉnh sửa User" : "Thêm User"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              fullWidth
            />
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => handleFormChange("username", e.target.value)}
              fullWidth
            />

            {!editingUser && (
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                fullWidth
              />
            )}

            <TextField
              label="Họ tên"
              value={form.fullname}
              fullWidth
              onChange={(e) => handleFormChange("fullname", e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => handleFormChange("role", e.target.value)}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) =>
                    handleFormChange("isActive", e.target.checked)
                  }
                />
              }
              label="Kích hoạt"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Đổi mật khẩu */}
      <Dialog
        open={openPassDialog}
        onClose={() => setOpenPassDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Đổi mật khẩu User</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Mật khẩu mới"
            type="password"
            value={passForm.newPassword}
            onChange={(e) =>
              setPassForm({ ...passForm, newPassword: e.target.value })
            }
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPassDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleChangePass}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnack}
          severity={snack.severity}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
