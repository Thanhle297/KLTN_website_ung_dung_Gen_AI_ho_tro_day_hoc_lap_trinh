import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "../theme";

// Key l\u01b0u trong localStorage
const THEME_STORAGE_KEY = "lms-theme-mode";

// L\u1ea5y theme t\u1eeb localStorage ho\u1eb7c system preference
function getInitialMode() {
  // \u01afu ti\u00ean l\u1ea5y t\u1eeb localStorage (ng\u01b0\u1eddi d\u00f9ng \u0111\u00e3 ch\u1ecdn)
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  // N\u1ebfu ch\u01b0a ch\u1ecdn, d\u00f9ng system preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export const ThemeContext = createContext({
  mode: "light",
  toggleTheme: () => {},
  setMode: () => {},
  isDark: false,
});

/**
 * ThemeProvider - Bao b\u1ecdc to\u00e0n b\u1ed9 app, cung c\u1ea5p:
 * - mode: "light" | "dark"
 * - toggleTheme(): chuy\u1ec3n \u0111\u1ed5i gi\u1eefa light/dark
 * - setMode(mode): set tr\u1ef1c ti\u1ebfp
 * - isDark: boolean ti\u1ec7n \u00edch
 *
 * T\u1ef1 \u0111\u1ed9ng:
 * - Set data-theme tr\u00ean <html> (\u0111\u1ec3 CSS variables trong _design-tokens.scss ho\u1ea1t \u0111\u1ed9ng)
 * - Truy\u1ec1n MUI theme t\u01b0\u01a1ng \u1ee9ng cho MuiThemeProvider
 * - L\u01b0u preference v\u00e0o localStorage
 * - Theo d\u00f5i system preference thay \u0111\u1ed5i
 */
export function AppThemeProvider({ children }) {
  const [mode, setModeState] = useState(getInitialMode);

  // \u0110\u1ed3ng b\u1ed9 data-theme attribute v\u00e0 localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  // L\u1eafng nghe system preference thay \u0111\u1ed5i (ch\u1ec9 khi user ch\u01b0a ch\u1ecdn th\u1ee7 c\u00f4ng)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange(e) {
      // Ch\u1ec9 t\u1ef1 \u0111\u1ed9ng \u0111\u1ed5i n\u1ebfu user ch\u01b0a l\u01b0u preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setModeState(e.matches ? "dark" : "light");
      }
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setMode = (newMode) => {
    if (newMode === "light" || newMode === "dark") {
      setModeState(newMode);
    }
  };

  const isDark = mode === "dark";

  // Memo h\u00f3a MUI theme \u0111\u1ec3 kh\u00f4ng t\u1ea1o l\u1ea1i m\u1ed7i l\u1ea7n render
  const muiTheme = useMemo(() => getTheme(mode), [mode]);

  // Memo h\u00f3a context value
  const contextValue = useMemo(
    () => ({ mode, toggleTheme, setMode, isDark }),
    [mode, isDark]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

/**
 * Hook ti\u1ec7n \u00edch \u0111\u1ec3 d\u00f9ng ThemeContext
 * @returns {{ mode: string, toggleTheme: Function, setMode: Function, isDark: boolean }}
 */
export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode ph\u1ea3i \u0111\u01b0\u1ee3c d\u00f9ng b\u00ean trong AppThemeProvider");
  }
  return context;
}
