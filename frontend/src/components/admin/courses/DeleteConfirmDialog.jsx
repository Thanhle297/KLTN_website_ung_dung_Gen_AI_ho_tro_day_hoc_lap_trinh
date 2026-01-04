import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { Warning } from "@mui/icons-material";

const DeleteConfirmDialog = ({ open, courseName, onConfirm, onCancel }) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
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
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
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
            Bạn có chắc chắn muốn xóa khóa học này?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mt: 2,
              p: 2,
              background:
                "linear-gradient(135deg, #fa709a15 0%, #fee14015 100%)",
              borderRadius: 2,
              fontWeight: 600,
              color: "#d63031",
            }}
          >
            {courseName}
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
            borderColor: "#cbd5e0",
            color: "#4a5568",
            "&:hover": {
              borderColor: "#a0aec0",
              background: "#f7fafc",
            },
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            "&:hover": {
              background: "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
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
