import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  useTheme,
} from "@mui/material";

const ChangePasswordDialog = ({
  open,
  password,
  onClose,
  onSave,
  onPasswordChange,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
          background: theme.palette.gradient.danger,
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
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
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
            background: theme.palette.gradient.danger,
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            "&:hover": {
              background: theme.palette.gradient.danger,
            },
          }}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(ChangePasswordDialog);
