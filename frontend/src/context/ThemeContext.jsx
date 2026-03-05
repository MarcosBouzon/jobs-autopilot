import { createContext, useContext, useState, useMemo } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeToggleContext = createContext({ toggleTheme: () => {}, mode: "light" });

export function useThemeToggle() {
  return useContext(ThemeToggleContext);
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                primary: { main: "#1a1a2e" },
                background: { default: "#f5f5f7", paper: "#ffffff" },
              }
            : {
                primary: { main: "#e2e8f0" },
                background: { default: "#0f0f0f", paper: "#1a1a1a" },
              }),
        },
        typography: {
          fontFamily: '"Roboto", "Inter", sans-serif',
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: { borderRadius: 10 },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                boxShadow: "none",
                borderBottom: mode === "light" ? "1px solid #e0e0e0" : "1px solid #2a2a2a",
                backgroundColor: mode === "light" ? "#ffffff" : "#141414",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: "none", fontWeight: 500 },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: mode === "light"
                  ? "0 1px 3px rgba(0,0,0,0.08)"
                  : "0 1px 3px rgba(0,0,0,0.4)",
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                "& .MuiTableCell-root": {
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: mode === "light" ? "#666" : "#999",
                },
              },
            },
          },
          MuiTableContainer: {
            styleOverrides: {
              root: {
                boxShadow: mode === "light"
                  ? "0 1px 3px rgba(0,0,0,0.08)"
                  : "0 1px 3px rgba(0,0,0,0.4)",
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeToggleContext.Provider value={{ toggleTheme, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}
