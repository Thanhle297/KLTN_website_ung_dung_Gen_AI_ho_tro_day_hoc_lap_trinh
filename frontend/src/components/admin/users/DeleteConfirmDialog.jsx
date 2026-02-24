import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const DeleteConfirmDialog = ({ open, user, onClose, onConfirm }) => {
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
          background: theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
            : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "white",
          fontWeight: 700,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon />
          Xác nhận xóa User
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Bạn có chắc chắn muốn xóa user này không?
        </Typography>
        {user && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: theme.palette.mode === "dark"
                ? "rgba(244, 63, 94, 0.1)"
                : "rgba(245, 87, 108, 0.1)",
              border: "1px solid rgba(245, 87, 108, 0.3)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Email: {user.email}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Username: {user.username}
            </Typography>
          </Box>
        )}
        <Typography
          variant="body2"
          color="error"
          sx={{ mt: 2, fontStyle: "italic" }}
        >
          ⚠️ Hành động này không thể hoàn tác!
        </Typography>
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
          onClick={onConfirm}
          sx={{
            background: theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
              : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            "&:hover": {
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
                : "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
            },
          }}
        >
          Xóa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(DeleteConfirmDialog);
