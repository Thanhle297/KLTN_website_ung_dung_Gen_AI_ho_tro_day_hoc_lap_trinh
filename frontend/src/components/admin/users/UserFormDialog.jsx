import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { AdminPanelSettings, School, Person } from "@mui/icons-material";

const UserFormDialog = ({
  open,
  editingUser,
  form,
  onClose,
  onSave,
  onFormChange,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField
            label="Email"
            value={form.email}
            onChange={(e) => onFormChange("email", e.target.value)}
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
            onChange={(e) => onFormChange("username", e.target.value)}
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
              onChange={(e) => onFormChange("password", e.target.value)}
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
            onChange={(e) => onFormChange("fullname", e.target.value)}
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
              onChange={(e) => onFormChange("role", e.target.value)}
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
                onChange={(e) => onFormChange("isActive", e.target.checked)}
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
          onClick={onClose}
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
          onClick={onSave}
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
  );
};

export default React.memo(UserFormDialog);
