import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useSelector, useDispatch } from "react-redux";
import { updateLinkedin } from "../../store/setupSlice.js";

const INSTRUCTIONS = [
  "Open LinkedIn in your browser and log in.",
  "Open DevTools (F12 or Cmd+Shift+I).",
  "Go to the Application tab → Cookies → https://www.linkedin.com.",
  "Find and copy the values for li_at, li_rm, and JSESSIONID.",
  "Paste them in the fields below.",
];

function LinkedInStep({ onNext, onBack }) {
  const dispatch = useDispatch();
  const { li_at, li_rm, jsession_id, linkedin_user, linkedin_pass } = useSelector((state) => state.setup.linkedin);

  const canSubmit =
    linkedin_user.trim().length > 0 &&
    linkedin_pass.length > 0 &&
    li_at.trim().length > 0 &&
    li_rm.trim().length > 0 &&
    jsession_id.trim().length > 0;

  function handleChange(field) {
    return (e) => dispatch(updateLinkedin({ [field]: e.target.value }));
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Connect LinkedIn
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, fontSize: ".85rem" }}>
        Provide your LinkedIn credentials so the autopilot can interact with the platform on your behalf. Your
        credentials are only stored locally on your machine and never sent to any server. You will be able to see how
        the autopilot interacts with LinkedIn in real time and can revoke access at any time by changing your password
        or deleting your session cookies.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Email / username"
          value={linkedin_user}
          onChange={handleChange("linkedin_user")}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Password"
          type="password"
          value={linkedin_pass}
          onChange={handleChange("linkedin_pass")}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <Typography color="text.secondary" sx={{ mb: 1, fontSize: ".85rem" }}>
        Provide your LinkedIn session cookies so the autopilot can fetch jobs from the platform on your behalf. Your
        cookies are only stored locally on your machine and never sent to any server. You can revoke access at any time
        by changing your password or deleting your session cookies.
      </Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
        Follow these steps to get your session cookies:
      </Typography>
      <Box component="ol" sx={{ pl: 2.5, mb: 2 }}>
        {INSTRUCTIONS.map((step) => (
          <Typography component="li" key={step} variant="body2" sx={{ mb: 0.5 }}>
            {step}
          </Typography>
        ))}
      </Box>

      <Button
        variant="outlined"
        href="https://www.linkedin.com/login"
        target="_blank"
        rel="noopener noreferrer"
        sx={{ mb: 2 }}
      >
        Open LinkedIn Login
      </Button>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="li_at"
          value={li_at}
          onChange={handleChange("li_at")}
          required
          fullWidth
          placeholder="AQEDAQbP..."
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="li_rm"
          value={li_rm}
          onChange={handleChange("li_rm")}
          required
          fullWidth
          placeholder="AQHi9..."
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="JSESSIONID"
          value={jsession_id}
          onChange={handleChange("jsession_id")}
          required
          fullWidth
          placeholder="ajax:123456..."
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onNext} disabled={!canSubmit}>
          Next
        </Button>
      </Stack>
    </Box>
  );
}

export default LinkedInStep;
