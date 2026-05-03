// =============================================================================
// theme.js - MUI Theme Configuration (Deep Ocean & Coral)
// Cung cấp light và dark theme cho MUI components.
// Đồng bộ với _design-tokens.scss
// =============================================================================

import { createTheme } from "@mui/material/styles";

// --- Bảng màu Deep Ocean ---
// Export để components/styles có thể tham chiếu trực tiếp khi cần
export const palette = {
  navy: {
    950: "#020617",
    900: "#0f172a",
    800: "#1e293b",
    700: "#334155",
    600: "#475569",
    500: "#64748b",
    400: "#94a3b8",
    300: "#cbd5e1",
    200: "#e2e8f0",
    100: "#f1f5f9",
    50: "#f8fafc",
  },
  coral: {
    600: "#e11d48",
    500: "#f43f5e",
    400: "#fb7185",
    300: "#fda4af",
    200: "#fecdd3",
    100: "#ffe4e6",
    50: "#fff1f2",
  },
  teal: {
    700: "#0f766e",
    600: "#0d9488",
    500: "#14b8a6",
    400: "#2dd4bf",
    300: "#5eead4",
    200: "#99f6e4",
    100: "#ccfbf1",
    50: "#f0fdfa",
  },
  blue: {
    700: "#1d4ed8",
    600: "#2563eb",
    500: "#3b82f6",
    400: "#60a5fa",
    300: "#93c5fd",
    200: "#bfdbfe",
    100: "#dbeafe",
    50: "#eff6ff",
  },
};

// --- C\u00e0i \u0111\u1eb7t chung cho c\u1ea3 2 theme ---
const sharedTypography = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    "sans-serif",
  ].join(","),
  h1: { fontWeight: 800, fontSize: "2.25rem", lineHeight: 1.25 },
  h2: { fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.3 },
  h3: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.35 },
  h4: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.4 },
  h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.45 },
  h6: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.5 },
  subtitle1: { fontWeight: 500, fontSize: "1rem", lineHeight: 1.5 },
  subtitle2: { fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5 },
  body1: { fontWeight: 400, fontSize: "1rem", lineHeight: 1.5 },
  body2: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.5 },
  caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.5 },
  button: { fontWeight: 600, fontSize: "0.875rem", textTransform: "none" },
};

const sharedShape = {
  borderRadius: 12,
};

// =============================================================================
// SHARED DESIGN TOKENS (Admin)
// Mọi gradient / shadow / background của admin TUYỆT ĐỐI dùng từ đây.
// Không hardcode hex code rải rác trong components nữa.
// =============================================================================

// --- Gradient hợp pháp (chỉ dùng 4 gradient sau, không thêm gradient lạ) ---
const sharedGradient = {
  // Primary brand gradient (header, button "Thêm", title gradient text)
  primary: `linear-gradient(135deg, ${palette.blue[600]} 0%, ${palette.blue[500]} 100%)`,
  primaryHover: `linear-gradient(135deg, ${palette.blue[700]} 0%, ${palette.blue[600]} 100%)`,
  // Secondary (coral) - dùng cho accent / CTA phụ
  secondary: `linear-gradient(135deg, ${palette.coral[500]} 0%, ${palette.coral[400]} 100%)`,
  // Danger (delete dialog) - đỏ thay vì hồng-vàng cũ để rõ ý "nguy hiểm"
  danger: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`,
  // Surface gradient (background trang admin light mode)
  adminSurfaceLight: `linear-gradient(135deg, ${palette.blue[50]} 0%, #ffffff 50%, ${palette.teal[50]} 100%)`,
};

// --- Custom shadows (boxShadow chuẩn) ---
const sharedCustomShadows = {
  light: {
    card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)",
    cardHover: "0 8px 24px -8px rgba(37, 99, 235, 0.18), 0 4px 8px -4px rgba(15, 23, 42, 0.08)",
    headerCard: "0 8px 32px -8px rgba(37, 99, 235, 0.12)",
    dialog: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)",
    appBar: "0 1px 0 0 rgba(15, 23, 42, 0.06)",
  },
  dark: {
    card: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)",
    cardHover: "0 8px 24px -8px rgba(0, 0, 0, 0.6), 0 4px 8px -4px rgba(0, 0, 0, 0.4)",
    headerCard: "0 8px 32px -8px rgba(0, 0, 0, 0.5)",
    dialog: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
    appBar: "0 1px 0 0 rgba(255, 255, 255, 0.06)",
  },
};

// --- Background admin layout ---
const sharedAdminBg = {
  light: {
    page: palette.navy[50],          // #f8fafc - nền chính trang admin
    pageGradient: `linear-gradient(135deg, ${palette.blue[50]} 0%, #ffffff 50%, ${palette.teal[50]} 100%)`,
    sidebar: "#ffffff",
    sidebarSelected: palette.blue[50],
    sidebarHover: palette.navy[100],
    appBar: "#ffffff",
    tableHead: palette.navy[50],
  },
  dark: {
    page: palette.navy[950],
    pageGradient: `linear-gradient(135deg, ${palette.navy[950]} 0%, ${palette.navy[900]} 100%)`,
    sidebar: palette.navy[900],
    sidebarSelected: "rgba(59, 130, 246, 0.16)",
    sidebarHover: "rgba(255, 255, 255, 0.04)",
    appBar: palette.navy[900],
    tableHead: palette.navy[800],
  },
};

const sharedTransitions = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
};

// =============================================================================
// LIGHT THEME
// =============================================================================
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: palette.blue[600],
      dark: palette.blue[700],
      light: palette.blue[100],
      contrastText: "#ffffff",
    },
    secondary: {
      main: palette.coral[500],
      dark: palette.coral[600],
      light: palette.coral[100],
      contrastText: "#ffffff",
    },
    info: {
      main: palette.teal[500],
      dark: palette.teal[600],
      light: palette.teal[100],
    },
    success: {
      main: "#10b981",
      dark: "#059669",
      light: "#ecfdf5",
    },
    warning: {
      main: "#f59e0b",
      dark: "#d97706",
      light: "#fffbeb",
    },
    error: {
      main: "#ef4444",
      dark: "#dc2626",
      light: "#fef2f2",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: palette.navy[900],
      secondary: palette.navy[600],
      disabled: palette.navy[400],
    },
    divider: palette.navy[200],
    // Màu tùy chỉnh (dùng qua theme.palette.navy, etc.)
    navy: palette.navy,
    coral: palette.coral,
    teal: palette.teal,
    // Tokens dành riêng cho admin
    gradient: sharedGradient,
    adminBg: sharedAdminBg.light,
  },
  customShadows: sharedCustomShadows.light,
  typography: sharedTypography,
  shape: sharedShape,
  transitions: sharedTransitions,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 20px",
          fontWeight: 600,
          boxShadow: "none",
          transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          },
        },
        containedPrimary: {
          background: sharedGradient.primary,
          "&:hover": {
            background: sharedGradient.primaryHover,
          },
        },
        containedSecondary: {
          background: sharedGradient.secondary,
          "&:hover": {
            background: `linear-gradient(135deg, ${palette.coral[600]} 0%, ${palette.coral[500]} 100%)`,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: sharedAdminBg.light.appBar,
          color: palette.navy[900],
          boxShadow: sharedCustomShadows.light.appBar,
          backgroundImage: "none",
          borderBottom: `1px solid ${palette.navy[200]}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: sharedAdminBg.light.sidebar,
          backgroundImage: "none",
          borderRight: `1px solid ${palette.navy[200]}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: sharedAdminBg.light.tableHead,
            color: palette.navy[700],
            fontWeight: 700,
            fontSize: "0.8125rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            borderBottom: `1px solid ${palette.navy[200]}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${palette.navy[200]}`,
          boxShadow: sharedCustomShadows.light.card,
          transition: "box-shadow 250ms ease, transform 250ms ease, border-color 250ms ease",
          "&:hover": {
            boxShadow: sharedCustomShadows.light.cardHover,
            borderColor: palette.navy[300],
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            transition: "border-color 250ms ease, box-shadow 250ms ease",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.blue[400],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.blue[600],
              boxShadow: `0 0 0 3px ${palette.blue[100]}`,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.navy[800],
          color: "#ffffff",
          fontSize: "0.75rem",
          borderRadius: 6,
          padding: "6px 12px",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: sharedCustomShadows.light.dialog,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          scrollbarColor: `${palette.navy[300]} ${palette.navy[100]}`,
        },
      },
    },
  },
});

// =============================================================================
// DARK THEME
// =============================================================================
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: palette.blue[400],
      dark: palette.blue[500],
      light: "rgba(59, 130, 246, 0.15)",
      contrastText: "#ffffff",
    },
    secondary: {
      main: palette.coral[400],
      dark: palette.coral[500],
      light: "rgba(244, 63, 94, 0.15)",
      contrastText: "#ffffff",
    },
    info: {
      main: palette.teal[400],
      dark: palette.teal[500],
      light: "rgba(20, 184, 166, 0.15)",
    },
    success: {
      main: "#34d399",
      dark: "#10b981",
      light: "rgba(16, 185, 129, 0.12)",
    },
    warning: {
      main: "#fbbf24",
      dark: "#f59e0b",
      light: "rgba(245, 158, 11, 0.12)",
    },
    error: {
      main: "#f87171",
      dark: "#ef4444",
      light: "rgba(239, 68, 68, 0.12)",
    },
    background: {
      default: palette.navy[950],
      paper: palette.navy[900],
    },
    text: {
      primary: palette.navy[50],
      secondary: palette.navy[300],
      disabled: palette.navy[600],
    },
    divider: palette.navy[700],
    navy: palette.navy,
    coral: palette.coral,
    teal: palette.teal,
    // Tokens dành riêng cho admin
    gradient: sharedGradient,
    adminBg: sharedAdminBg.dark,
  },
  customShadows: sharedCustomShadows.dark,
  typography: sharedTypography,
  shape: sharedShape,
  transitions: sharedTransitions,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 20px",
          fontWeight: 600,
          boxShadow: "none",
          transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${palette.blue[500]} 0%, ${palette.blue[400]} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${palette.blue[600]} 0%, ${palette.blue[500]} 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${palette.coral[400]} 0%, ${palette.coral[300]} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${palette.coral[500]} 0%, ${palette.coral[400]} 100%)`,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: sharedAdminBg.dark.appBar,
          color: palette.navy[50],
          boxShadow: sharedCustomShadows.dark.appBar,
          backgroundImage: "none",
          borderBottom: `1px solid ${palette.navy[700]}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: sharedAdminBg.dark.sidebar,
          backgroundImage: "none",
          borderRight: `1px solid ${palette.navy[700]}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: sharedAdminBg.dark.tableHead,
            color: palette.navy[200],
            fontWeight: 700,
            fontSize: "0.8125rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            borderBottom: `1px solid ${palette.navy[700]}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${palette.navy[700]}`,
          backgroundColor: palette.navy[800],
          boxShadow: sharedCustomShadows.dark.card,
          transition: "box-shadow 250ms ease, transform 250ms ease, border-color 250ms ease",
          "&:hover": {
            boxShadow: sharedCustomShadows.dark.cardHover,
            borderColor: palette.navy[600],
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            transition: "border-color 250ms ease, box-shadow 250ms ease",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.blue[400],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.blue[400],
              boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.15)`,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.navy[700],
          color: palette.navy[50],
          fontSize: "0.75rem",
          borderRadius: 6,
          padding: "6px 12px",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundColor: palette.navy[900],
          boxShadow: sharedCustomShadows.dark.dialog,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          scrollbarColor: `${palette.navy[600]} ${palette.navy[800]}`,
        },
      },
    },
  },
});

// H\u00e0m l\u1ea5y theme theo mode
export function getTheme(mode) {
  return mode === "dark" ? darkTheme : lightTheme;
}
