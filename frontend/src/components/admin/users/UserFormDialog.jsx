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
  useTheme,
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
  const theme = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
PaperProps={{
        sx: {
          borderRadius: 4,
          background: theme.palette.background.paper,
          backdropFilter: "blur(10px)",
        },
      }}
    >
<DialogTitle
        sx={{
          background: theme.palette.gradient.primary,
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
                    color: theme.palette.primary.main,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: theme.palette.primary.main,
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
            background: theme.palette.gradient.primary,
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            "&:hover": {
              background: theme.palette.gradient.primaryHover,
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
