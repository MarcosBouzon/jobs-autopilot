import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import logo from "../../assets/jap-logo.jpg";

function WelcomeStep({ onNext }) {
  return (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <Box
        sx={{
          display: "inline-block",
          bgcolor: "grey.900",
          borderRadius: 3,
          p: 2,
          mb: 3,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Jobs Autopilot"
          sx={{ width: 180, maxWidth: "100%", display: "block" }}
        />
      </Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Welcome to Jobs Autopilot
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 420, mx: "auto" }}>
        Let's get you set up. We'll walk you through a few steps to connect
        your LinkedIn account so the autopilot can start finding and applying
        to jobs on your behalf.
      </Typography>
      <Button variant="contained" size="large" onClick={onNext}>
        Get Started
      </Button>
    </Box>
  );
}

export default WelcomeStep;
