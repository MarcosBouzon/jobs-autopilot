import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Checkbox from "@mui/material/Checkbox";
import { useSelector, useDispatch } from "react-redux";
import { updateWork } from "../../store/setupSlice.js";

const REQUIRED_FIELDS = [
  "legally_authorized",
  "require_sponsorship",
  "work_permit_type",
  "salary",
  "years_of_experience",
];

function WorkDetailsStep({ onBack, onNext }) {
  const dispatch = useDispatch();
  const form = useSelector((state) => state.setup.work);

  const canSubmit = REQUIRED_FIELDS.every(
    (k) => String(form[k]).trim().length > 0
  );

  function handleChange(field) {
    return (e) => dispatch(updateWork({ [field]: e.target.value }));
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Work Details
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Pre-answer common job application questions so the autopilot
        can fill them in automatically.
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Work Authorization
      </Typography>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <FormControl required>
          <FormLabel>
            Are you legally authorized to work in the country you
            are applying?
          </FormLabel>
          <RadioGroup
            row
            value={form.legally_authorized}
            onChange={handleChange("legally_authorized")}
          >
            <FormControlLabel
              value="Yes"
              control={<Radio />}
              label="Yes"
            />
            <FormControlLabel
              value="No"
              control={<Radio />}
              label="No"
            />
          </RadioGroup>
        </FormControl>

        <FormControl required>
          <FormLabel>
            Will you now or in the future require sponsorship?
          </FormLabel>
          <RadioGroup
            row
            value={form.require_sponsorship}
            onChange={handleChange("require_sponsorship")}
          >
            <FormControlLabel
              value="Yes"
              control={<Radio />}
              label="Yes"
            />
            <FormControlLabel
              value="No"
              control={<Radio />}
              label="No"
            />
          </RadioGroup>
        </FormControl>

        <FormControl required>
          <FormLabel>Work permit type</FormLabel>
          <RadioGroup
            row
            value={form.work_permit_type}
            onChange={handleChange("work_permit_type")}
          >
            <FormControlLabel
              value="Citizen"
              control={<Radio />}
              label="Citizen"
            />
            <FormControlLabel
              value="Permanent Resident"
              control={<Radio />}
              label="Permanent Resident"
            />
            <FormControlLabel
              value="Open Work Permit"
              control={<Radio />}
              label="Open Work Permit"
            />
          </RadioGroup>
        </FormControl>
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
        Work place
      </Typography>
      <Stack direction="row" sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.remote}
              onChange={(e) => dispatch(updateWork({ remote: e.target.checked }))}
            />
          }
          label="Remote"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={form.hybrid}
              onChange={(e) => dispatch(updateWork({ hybrid: e.target.checked }))}
            />
          }
          label="Hybrid"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={form.on_site}
              onChange={(e) => dispatch(updateWork({ on_site: e.target.checked }))}
            />
          }
          label="On Site"
        />
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
        Compensation
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            label="Expected annual salary"
            type="number"
            value={form.salary}
            onChange={handleChange("salary")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Currency"
            value={form.currency}
            onChange={handleChange("currency")}
            fullWidth
            placeholder="USD"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Acceptable salary range"
            value={form.salary_range}
            onChange={handleChange("salary_range")}
            fullWidth
            placeholder="120000-145000"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
        Experience
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Current/most recent job title"
            value={form.current_title}
            onChange={handleChange("current_title")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Target roles"
            value={form.target_role}
            onChange={handleChange("target_role")}
            fullWidth
            placeholder="Python Developer, Backend Engineer, Software Engineer"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Years of experience"
            type="number"
            value={form.years_of_experience}
            onChange={handleChange("years_of_experience")}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4.5 }}>
          <TextField
            label="Highest education level"
            value={form.education_level}
            onChange={handleChange("education_level")}
            fullWidth
            placeholder="Bachelor's, Master's, PhD, Self-taught"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4.5 }}>
          <TextField
            label="School"
            value={form.school}
            onChange={handleChange("school")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

      <Stack
        direction="row"
        spacing={2}
        justifyContent="space-between"
      >
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

export default WorkDetailsStep;
