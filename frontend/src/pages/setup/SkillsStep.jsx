import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useSelector, useDispatch } from "react-redux";
import { updateSkills } from "../../store/setupSlice.js";

function SkillsStep({ onBack, onNext }) {
  const dispatch = useDispatch();
  const form = useSelector((state) => state.setup.skills);

  function handleChange(field) {
    return (e) => dispatch(updateSkills({ [field]: e.target.value }));
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Skills
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        List your technical skills so the autopilot can match you with relevant positions. Separate each item with a
        comma.
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Programming languages"
          value={form.programming_languages}
          onChange={handleChange("programming_languages")}
          fullWidth
          placeholder="Python, Java, C/C++, JavaScript"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Frameworks"
          value={form.frameworks}
          onChange={handleChange("frameworks")}
          fullWidth
          multiline
          rows={3}
          placeholder="React, Flask, Laravel, Django, FastAPI"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Tools"
          value={form.tools}
          onChange={handleChange("tools")}
          fullWidth
          multiline
          rows={3}
          placeholder="Git, AWS, Azure, GitLab, Docker, Kubernetes"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onNext}>
          Next
        </Button>
      </Stack>
    </Box>
  );
}

export default SkillsStep;
