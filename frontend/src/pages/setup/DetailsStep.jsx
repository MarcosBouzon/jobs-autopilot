import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import { useSelector, useDispatch } from "react-redux";
import { updateDetails } from "../../store/setupSlice.js";

const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "country",
  "zip_code",
];

function DetailsStep({ onBack, onNext }) {
  const dispatch = useDispatch();
  const form = useSelector((state) => state.setup.details);

  const canSubmit = REQUIRED_FIELDS.every((k) => form[k].trim().length > 0);

  function handleChange(field) {
    return (e) => dispatch(updateDetails({ [field]: e.target.value }));
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Personal Details
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Fill in your details so the autopilot can complete job applications on
        your behalf.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="First name"
            value={form.first_name}
            onChange={handleChange("first_name")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Last name"
            value={form.last_name}
            onChange={handleChange("last_name")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Phone"
            value={form.phone}
            onChange={handleChange("phone")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
        Address
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Street address"
            value={form.address}
            onChange={handleChange("address")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="City"
            value={form.city}
            onChange={handleChange("city")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="State"
            value={form.state}
            onChange={handleChange("state")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Country"
            value={form.country}
            onChange={handleChange("country")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Zip code"
            value={form.zip_code}
            onChange={handleChange("zip_code")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
        Links (optional)
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="LinkedIn URL"
            value={form.linkedin_url}
            onChange={handleChange("linkedin_url")}
            fullWidth
            placeholder="https://linkedin.com/in/yourprofile"
            helperText="Some applications require this. The autopilot will skip those if missing."
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Website URL"
            value={form.website_url}
            onChange={handleChange("website_url")}
            fullWidth
            placeholder="https://yourwebsite.com"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Portfolio URL"
            value={form.portfolio_url}
            onChange={handleChange("portfolio_url")}
            fullWidth
            placeholder="https://yourportfolio.com"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!canSubmit}
        >
          Next
        </Button>
      </Stack>
    </Box>
  );
}

export default DetailsStep;
