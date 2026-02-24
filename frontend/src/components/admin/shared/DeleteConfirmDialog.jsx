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
import { Warning } from "@mui/icons-material";

const DeleteConfirmDialog = ({
  open,
  itemName,
  itemType = "item",
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      disableRestoreFocus
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
          background: theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
            : "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Warning sx={{ fontSize: 28 }} />
        Xác nhận xóa
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h6" gutterBottom>
            Bạn có chắc chắn muốn xóa {itemType} này?
          </Typography>
<Typography
            variant="body1"
            sx={{
              mt: 2,
              p: 2,
              background: theme.palette.mode === "dark"
                ? "rgba(244, 63, 94, 0.1)"
                : "linear-gradient(135deg, #fa709a15 0%, #fee14015 100%)",
              borderRadius: 2,
              fontWeight: 600,
              color: theme.palette.error.main,
            }}
          >
            {itemName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            ⚠️ Hành động này không thể hoàn tác!
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
<Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            borderColor: theme.palette.divider,
            color: theme.palette.text.secondary,
            "&:hover": {
              borderColor: theme.palette.text.primary,
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          Hủy
        </Button>
<Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            background: theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
              : "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            "&:hover": {
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
                : "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
            },
          }}
        >
          Xác nhận xóa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
