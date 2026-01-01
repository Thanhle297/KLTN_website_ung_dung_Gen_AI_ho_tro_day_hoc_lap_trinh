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
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fade,
  TablePagination,
} from "@mui/material";
import {
  Edit,
  Delete,
  Key,
  Search,
  PersonAdd,
  AdminPanelSettings,
  School,
  Person,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";

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

  /* ============================== PAGINATION HANDLERS ============================== */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

  /* ============================== HELPER FUNCTIONS ============================== */
  const getRoleConfig = (role) => {
    const configs = {
      admin: {
        icon: <AdminPanelSettings />,
        color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        label: "Admin",
        chipColor: "secondary",
      },
      teacher: {
        icon: <School />,
        color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        label: "Teacher",
        chipColor: "primary",
      },
      user: {
        icon: <Person />,
        color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        label: "User",
        chipColor: "info",
      },
    };
    return configs[role] || configs.user;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
      }}
    >
      {/* Header Section */}
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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            👥 Quản lý Người dùng
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={openCreateDialog}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              px: 3,
              py: 1.5,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Thêm User Mới
          </Button>
        </Stack>

        <TextField
          placeholder="🔍 Tìm kiếm theo username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0); // Reset page on search
          }}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: "white",
              "& fieldset": {
                borderColor: "#e0e0e0",
              },
              "&:hover fieldset": {
                borderColor: "#667eea",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#667eea",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#667eea" }} />
              </InputAdornment>
            ),
          }}
        />
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
                    align="right"
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
                {paginatedUsers.map((user, index) => {
                  const roleConfig = getRoleConfig(user.role);
                  return (
                    <Fade
                      in={true}
                      key={user._id}
                      style={{ transitionDelay: `${index * 30}ms` }}
                    >
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "#f7fafc",
                            transform: "scale(1.01)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                          },
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                      >
                        {/* User Info with Avatar */}
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                background: roleConfig.color,
                                width: 45,
                                height: 45,
                                fontWeight: 700,
                                fontSize: "1rem",
                              }}
                            >
                              {getInitials(user.fullname || user.username)}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: "#2d3748",
                                }}
                              >
                                {user.fullname || user.username}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Email */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#4a5568",
                            }}
                          >
                            {user.email}
                          </Typography>
                        </TableCell>

                        {/* Username */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#718096",
                              fontFamily: "monospace",
                              backgroundColor: "#edf2f7",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              display: "inline-block",
                            }}
                          >
                            @{user.username}
                          </Typography>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Chip
                            icon={roleConfig.icon}
                            label={roleConfig.label}
                            color={roleConfig.chipColor}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                            }}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            icon={
                              user.isActive ? (
                                <CheckCircle sx={{ fontSize: 16 }} />
                              ) : (
                                <Cancel sx={{ fontSize: 16 }} />
                              )
                            }
                            label={user.isActive ? "Hoạt động" : "Khóa"}
                            color={user.isActive ? "success" : "error"}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                            }}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <IconButton
                              onClick={() => openChangePass(user)}
                              sx={{
                                background:
                                  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                color: "white",
                                width: 36,
                                height: 36,
                                "&:hover": {
                                  background:
                                    "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                              }}
                              size="small"
                            >
                              <Key sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                              onClick={() => openEditDialog(user)}
                              sx={{
                                background:
                                  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                color: "white",
                                width: 36,
                                height: 36,
                                "&:hover": {
                                  background:
                                    "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                              }}
                              size="small"
                            >
                              <Edit sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(user)}
                              sx={{
                                background:
                                  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                                color: "white",
                                width: 36,
                                height: 36,
                                "&:hover": {
                                  background:
                                    "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                              }}
                              size="small"
                            >
                              <Delete sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  );
                })}

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
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: "1.5rem",
          }}
        >
          {editingUser ? "✏️ Chỉnh sửa User" : "➕ Thêm User Mới"}
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => handleFormChange("username", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {!editingUser && (
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            )}

            <TextField
              label="Họ tên"
              value={form.fullname}
              fullWidth
              onChange={(e) => handleFormChange("fullname", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => handleFormChange("role", e.target.value)}
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="user">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Person fontSize="small" />
                    <span>User</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="teacher">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <School fontSize="small" />
                    <span>Teacher</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="admin">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AdminPanelSettings fontSize="small" />
                    <span>Admin</span>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) =>
                    handleFormChange("isActive", e.target.checked)
                  }
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#667eea",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#667eea",
                    },
                  }}
                />
              }
              label="Kích hoạt tài khoản"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
              },
            }}
          >
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
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            fontWeight: 700,
          }}
        >
          🔑 Đổi mật khẩu User
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <TextField
            label="Mật khẩu mới"
            type="password"
            value={passForm.newPassword}
            onChange={(e) =>
              setPassForm({ ...passForm, newPassword: e.target.value })
            }
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setOpenPassDialog(false)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePass}
            sx={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              "&:hover": {
                background: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
              },
            }}
          >
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
          sx={{
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
