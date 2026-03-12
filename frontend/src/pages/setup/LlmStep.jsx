import { useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import {
  useUpdateSettingsMutation,
  useUploadResumeMutation,
} from "../../store/apiSlice.js";
import { updateLlm } from "../../store/setupSlice.js";

function parseList(csv) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function LlmStep({ onBack, resumeFileRef }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const setup = useSelector((state) => state.setup);
  const [uploadResume] = useUploadResumeMutation();
  const [updateSettings] = useUpdateSettingsMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const form = setup.llm;

  const hasCloudKey =
    form.openai_api_key.trim().length > 0 ||
    form.gemini_api_key.trim().length > 0 ||
    form.claude_api_key.trim().length > 0;

  const hasLocalLlm =
    form.local_llm_path.trim().length > 0 &&
    form.local_llm_model.trim().length > 0;

  const canSubmit = hasCloudKey || hasLocalLlm;

  function handleChange(field) {
    return (e) => dispatch(updateLlm({ [field]: e.target.value }));
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
        openai_api_key: form.openai_api_key.trim(),
        gemini_api_key: form.gemini_api_key.trim(),
        claude_api_key: form.claude_api_key.trim(),
        local_llm_path: form.local_llm_path.trim(),
        local_llm_model: form.local_llm_model.trim(),
      },
      form: {
        about: setup.profile.aboutMe.trim(),
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
        school: setup.work.school.trim(),
        programming_languages: parseList(
          setup.skills.programming_languages
        ),
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
        LLM
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Configure at least one AI provider so the autopilot can generate
        answers for your applications.
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        API Keys
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="OpenAI API key"
          type="password"
          value={form.openai_api_key}
          onChange={handleChange("openai_api_key")}
          fullWidth
          helperText="Get your key at platform.openai.com/api-keys"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Gemini API key"
          type="password"
          value={form.gemini_api_key}
          onChange={handleChange("gemini_api_key")}
          fullWidth
          helperText="Get your key at aistudio.google.com/apikey"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Claude API key"
          type="password"
          value={form.claude_api_key}
          onChange={handleChange("claude_api_key")}
          fullWidth
          helperText="Get your key at console.anthropic.com/settings/keys"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Local LLM
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Local LLM path"
          value={form.local_llm_path}
          onChange={handleChange("local_llm_path")}
          fullWidth
          placeholder="http://localhost:11434"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Local LLM model"
          value={form.local_llm_model}
          onChange={handleChange("local_llm_model")}
          fullWidth
          placeholder="llama3.2"
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
        <Button
          variant="contained"
          onClick={handleFinish}
          disabled={!canSubmit || isLoading}
          loading={isLoading}
        >
          Finish
        </Button>
      </Stack>
    </Box>
  );
}

export default LlmStep;
