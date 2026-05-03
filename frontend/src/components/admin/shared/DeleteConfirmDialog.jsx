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
import { dangerButtonSx } from "../../../styles/adminTokens";

/**
 * Dialog xác nhận xóa dùng chung cho mọi trang admin.
 *
 * @param {boolean}  open         - Hiển thị dialog
 * @param {string}   itemName     - Tên item sẽ xóa (hiển thị nổi bật)
 * @param {string}   itemType     - Loại item ("khóa học", "bài học", "người dùng"…)
 * @param {Array}    itemDetails  - (Tuỳ chọn) Mảng { label, value } để hiển thị thêm thông tin
 * @param {Function} onConfirm    - Callback khi xác nhận xóa
 * @param {Function} onCancel     - Callback khi huỷ / đóng dialog
 */
const DeleteConfirmDialog = ({
  open,
  itemName,
  itemType = "mục này",
  itemDetails,
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
          background: theme.palette.gradient.danger,
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
            Bạn có chắc chắn muốn xóa {itemType}?
          </Typography>

          {/* Tên item nổi bật */}
          {itemName && (
            <Typography
              variant="body1"
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: theme.palette.action.selected,
                borderRadius: 2,
                fontWeight: 600,
                color: theme.palette.error.main,
              }}
            >
              {itemName}
            </Typography>
          )}

          {/* Chi tiết bổ sung (vd: email, username cho user) */}
          {itemDetails && itemDetails.length > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.action.selected,
                border: `1px solid ${theme.palette.error.light}30`,
                textAlign: "left",
              }}
            >
              {itemDetails.map((detail, idx) => (
                <Typography
                  key={idx}
                  variant="body2"
                  sx={{ fontWeight: 600, mb: idx < itemDetails.length - 1 ? 0.5 : 0 }}
                >
                  {detail.label}: {detail.value}
                </Typography>
              ))}
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Hành động này không thể hoàn tác!
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
            ...dangerButtonSx(theme),
            borderRadius: 2,
            textTransform: "none",
            px: 3,
          }}
        >
          Xác nhận xóa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(DeleteConfirmDialog);
