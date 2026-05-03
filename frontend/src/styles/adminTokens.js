// =============================================================================
// adminTokens.js - Style helpers tập trung cho mọi page admin
// -----------------------------------------------------------------------------
// Mục đích:
//   - Đồng bộ background / shadow / radius / padding của các "card", "header",
//     "page wrapper" trong admin area.
//   - Thay thế hoàn toàn các hardcoded inline `sx` lặp lại hàng chục lần.
// Cách dùng:
//   import { adminCardSx, adminHeaderCardSx, adminPageWrapperSx,
//            gradientTextSx, gradientButtonSx } from "../../styles/adminTokens";
//   <Box sx={adminPageWrapperSx}>
//     <Paper sx={adminHeaderCardSx}>...</Paper>
//   </Box>
//
// Lưu ý:
//   - Mọi helper là FUNCTION nhận theme (compatible với MUI sx callback) HOẶC
//     là OBJECT "sx" trực tiếp dùng theme.palette.* + theme.customShadows.*
//   - Để dùng object cần MUI tự inject theme: ta cung cấp dạng (theme) => ({...})
//     để có thể truy cập palette.adminBg và customShadows từ theme.
// =============================================================================

// --- Helper: wrap toàn bộ trang admin (background + padding responsive) -------
export const adminPageWrapperSx = (theme) => ({
  minHeight: "100%",
  width: "100%",
  px: { xs: 2, sm: 3, md: 4 },
  py: { xs: 2, sm: 3 },
  background:
    theme.palette.mode === "dark"
      ? theme.palette.adminBg.pageGradient
      : theme.palette.adminBg.pageGradient,
  transition: theme.transitions.create(["background-color", "background"], {
    duration: theme.transitions.duration.standard,
  }),
});

// --- Card chuẩn (table container, list container, dialog inner) --------------
export const adminCardSx = (theme) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: 3,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.customShadows?.card,
  overflow: "hidden",
  transition: theme.transitions.create(["box-shadow", "border-color"], {
    duration: theme.transitions.duration.short,
  }),
  "&:hover": {
    boxShadow: theme.customShadows?.cardHover,
  },
});

// --- Header card (tiêu đề + actions của mỗi page CRUD) -----------------------
export const adminHeaderCardSx = (theme) => ({
  position: "relative",
  p: { xs: 2.5, sm: 3 },
  mb: { xs: 2, sm: 3 },
  borderRadius: 3,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.customShadows?.headerCard,
  overflow: "hidden",
  // Decoration: dải gradient mỏng phía trên header card để tạo điểm nhấn
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: theme.palette.gradient.primary,
  },
});

// --- Section card (dùng trong dashboard, group nội dung) ---------------------
export const adminSectionSx = (theme) => ({
  p: { xs: 2, sm: 3 },
  borderRadius: 3,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.customShadows?.card,
});

// --- Title gradient text (dùng cho page title) -------------------------------
export const gradientTextSx = (theme) => ({
  background: theme.palette.gradient.primary,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  display: "inline-block",
  fontWeight: 700,
});

// --- Button gradient (CTA chính: "Thêm…", "Lưu", "Tạo") ----------------------
// Dùng kèm <Button variant="contained"> để tận dụng default ripple/focus.
export const gradientButtonSx = (theme) => ({
  background: theme.palette.gradient.primary,
  color: "#ffffff",
  fontWeight: 600,
  px: 2.5,
  boxShadow: "0 4px 14px -4px rgba(37, 99, 235, 0.45)",
  "&:hover": {
    background: theme.palette.gradient.primaryHover,
    boxShadow: "0 6px 18px -4px rgba(37, 99, 235, 0.55)",
  },
  "&:disabled": {
    background:
      theme.palette.mode === "dark"
        ? theme.palette.navy[800]
        : theme.palette.navy[200],
    color: theme.palette.text.disabled,
    boxShadow: "none",
  },
});

// --- Danger button (delete) --------------------------------------------------
export const dangerButtonSx = (theme) => ({
  background: theme.palette.gradient.danger,
  color: "#ffffff",
  fontWeight: 600,
  "&:hover": {
    background: theme.palette.gradient.danger,
    filter: "brightness(0.95)",
  },
});

// --- Stat card (dùng cho AdminHome dashboard) --------------------------------
export const statCardSx = (theme) => ({
  p: 2.5,
  borderRadius: 3,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.customShadows?.card,
  transition: theme.transitions.create(["transform", "box-shadow"], {
    duration: theme.transitions.duration.short,
  }),
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.customShadows?.cardHover,
  },
});

// --- Sticky table container --------------------------------------------------
export const stickyTableContainerSx = (theme) => ({
  ...adminCardSx(theme),
  maxHeight: "calc(100vh - 280px)",
  overflow: "auto",
});

// --- Helper trả về icon wrapper "tròn gradient" cho header/page icon ---------
export const iconCircleSx = (theme) => ({
  width: 48,
  height: 48,
  borderRadius: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: theme.palette.gradient.primary,
  color: "#ffffff",
  boxShadow: "0 4px 14px -4px rgba(37, 99, 235, 0.45)",
  "& svg": {
    fontSize: 26,
  },
});

// --- Tổng hợp 1 default export tiện cho ai thích import 1 dòng ---------------
const adminTokens = {
  adminPageWrapperSx,
  adminCardSx,
  adminHeaderCardSx,
  adminSectionSx,
  gradientTextSx,
  gradientButtonSx,
  dangerButtonSx,
  statCardSx,
  stickyTableContainerSx,
  iconCircleSx,
};

export default adminTokens;
