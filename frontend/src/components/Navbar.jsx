import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { Link as RouterLink } from "react-router";
import WorkIcon from "@mui/icons-material/Work";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useThemeToggle } from "../context/ThemeContext.jsx";

function Navbar() {
  const { toggleTheme, mode } = useThemeToggle();

  return (
    <AppBar position="static" color="default">
      <Toolbar>
        <WorkIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          Jobs Autopilot
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          <Button color="inherit" component={RouterLink} to="/" sx={{ color: "text.primary" }}>
            Jobs
          </Button>
          <Button color="inherit" component={RouterLink} to="/applied" sx={{ color: "text.primary" }}>
            Applied
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/live"
            startIcon={
              <FiberManualRecordIcon
                sx={{
                  fontSize: "10px !important",
                  color: "error.main",
                  animation: "pulse 1.4s ease-in-out infinite",
                  "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                }}
              />
            }
            sx={{ color: "text.primary" }}
          >
            Live
          </Button>
          <Button color="inherit" component={RouterLink} to="/settings" sx={{ color: "text.primary" }}>
            Settings
          </Button>
          <IconButton onClick={toggleTheme} sx={{ ml: 1, color: "text.primary" }}>
            {mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
