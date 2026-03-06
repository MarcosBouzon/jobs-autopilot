import { useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useUpdateSettingsMutation, useUploadResumeMutation } from "../../store/apiSlice.js";
import { updateSkills } from "../../store/setupSlice.js";

function parseList(csv) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function SkillsStep({ onBack, resumeFileRef }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const setup = useSelector((state) => state.setup);
  const [uploadResume] = useUploadResumeMutation();
  const [updateSettings] = useUpdateSettingsMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(field) {
    return (e) => dispatch(updateSkills({ [field]: e.target.value }));
  }

  async function handleFinish() {
    setIsLoading(true);
    setError(null);

    if (resumeFileRef.current) {
      const uploadResult = await uploadResume(resumeFileRef.current);
      if (uploadResult.error) {
        setError("Failed to upload resume. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    const settings = {
      config: {
        li_at: setup.linkedin.li_at.trim(),
        li_rm: setup.linkedin.li_rm.trim(),
        jsession_id: setup.linkedin.jsession_id.trim(),
        linkedin_user: setup.linkedin.linkedin_user.trim(),
        linkedin_pass: setup.linkedin.linkedin_pass,
        remote: setup.work.remote,
        hybrid: setup.work.hybrid,
        on_site: setup.work.on_site,
      },
      form: {
        first_name: setup.details.first_name.trim(),
        last_name: setup.details.last_name.trim(),
        email: setup.details.email.trim(),
        phone: setup.details.phone.trim(),
        address: setup.details.address.trim(),
        city: setup.details.city.trim(),
        state: setup.details.state.trim(),
        country: setup.details.country.trim(),
        zip_code: setup.details.zip_code.trim(),
        linkedin_url: setup.details.linkedin_url.trim(),
        website_url: setup.details.website_url.trim(),
        portfolio_url: setup.details.portfolio_url.trim(),
        legally_authorized: setup.work.legally_authorized,
        require_sponsorship: setup.work.require_sponsorship,
        work_permit_type: setup.work.work_permit_type,
        salary: setup.work.salary,
        currency: setup.work.currency.trim(),
        salary_range: setup.work.salary_range.trim(),
        current_title: setup.work.current_title.trim(),
        target_role: parseList(setup.work.target_role),
        years_of_experience: setup.work.years_of_experience,
        education_level: setup.work.education_level.trim(),
        programming_languages: parseList(setup.skills.programming_languages),
        frameworks: parseList(setup.skills.frameworks),
        tools: parseList(setup.skills.tools),
      },
      eeo: {},
    };

    const result = await updateSettings(settings);
    setIsLoading(false);

    if (result.error) {
      setError("Failed to save settings. Please try again.");
      return;
    }

    navigate("/");
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
          value={setup.skills.programming_languages}
          onChange={handleChange("programming_languages")}
          fullWidth
          placeholder="Python, Java, C/C++, JavaScript"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Frameworks"
          value={setup.skills.frameworks}
          onChange={handleChange("frameworks")}
          fullWidth
          multiline
          rows={3}
          placeholder="React, Flask, Laravel, Django, FastAPI"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Tools"
          value={setup.skills.tools}
          onChange={handleChange("tools")}
          fullWidth
          multiline
          rows={3}
          placeholder="Git, AWS, Azure, GitLab, Docker, Kubernetes"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={handleFinish} disabled={isLoading} loading={isLoading}>
          Finish
        </Button>
      </Stack>
    </Box>
  );
}

export default SkillsStep;
