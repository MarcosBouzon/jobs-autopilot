import { useState, useEffect, useRef } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Checkbox from "@mui/material/Checkbox";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useUploadResumeMutation,
} from "../store/apiSlice.js";

function parseList(csv) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinList(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "";
}

function SectionWrapper({ children, onUpdate, isUpdating, error, success }) {
  return (
    <Box>
      {children}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings updated.
        </Alert>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={onUpdate}
          loading={isUpdating}
          disabled={isUpdating}
        >
          Update
        </Button>
      </Box>
    </Box>
  );
}

function LinkedInSection({ data, updateSettings }) {
  const [form, setForm] = useState({
    linkedin_user: "",
    linkedin_pass: "",
    li_at: "",
    li_rm: "",
    jsession_id: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        linkedin_user: data.config.linkedin_user ?? "",
        linkedin_pass: data.config.linkedin_pass ?? "",
        li_at: data.config.li_at ?? "",
        li_rm: data.config.li_rm ?? "",
        jsession_id: data.config.jsession_id ?? "",
      });
    }
  }, [data]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleUpdate() {
    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    const result = await updateSettings({
      ...data,
      config: { ...data.config, ...form },
    });
    setIsUpdating(false);
    if (result.error) {
      setError("Failed to update LinkedIn settings.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <SectionWrapper
      onUpdate={handleUpdate}
      isUpdating={isUpdating}
      error={error}
      success={success}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        LinkedIn
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Credentials
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Email / username"
          value={form.linkedin_user}
          onChange={handleChange("linkedin_user")}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Password"
          type="password"
          value={form.linkedin_pass}
          onChange={handleChange("linkedin_pass")}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Session Cookies
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="li_at"
          value={form.li_at}
          onChange={handleChange("li_at")}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="li_rm"
          value={form.li_rm}
          onChange={handleChange("li_rm")}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="JSESSIONID"
          value={form.jsession_id}
          onChange={handleChange("jsession_id")}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
    </SectionWrapper>
  );
}

function ProfileSection({ data, updateSettings }) {
  const [about, setAbout] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadResume] = useUploadResumeMutation();

  useEffect(() => {
    if (data) {
      setAbout(data.form.about ?? "");
    }
  }, [data]);

  async function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected?.type === "application/pdf") return;
    setIsUploading(true);
    setUploadMsg(null);
    const result = await uploadResume(selected);
    setIsUploading(false);
    if (result.error) {
      setUploadMsg({ severity: "error", text: "Failed to upload resume." });
    } else {
      setFileName(selected.name);
      setUploadMsg({ severity: "success", text: "Resume uploaded." });
      setTimeout(() => setUploadMsg(null), 3000);
    }
  }

  async function handleUpdate() {
    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    const result = await updateSettings({
      ...data,
      form: { ...data.form, about },
    });
    setIsUpdating(false);
    if (result.error) {
      setError("Failed to update profile settings.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <SectionWrapper
      onUpdate={handleUpdate}
      isUpdating={isUpdating}
      error={error}
      success={success}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Profile
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Resume (PDF)
      </Typography>
      <Box
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: "2px dashed",
          borderColor: fileName ? "success.main" : "divider",
          borderRadius: 2,
          p: 3,
          mb: 2,
          textAlign: "center",
          cursor: "pointer",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "action.hover",
          },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleFileChange}
        />
        {fileName ? (
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            alignItems="center"
          >
            <InsertDriveFileIcon color="success" />
            <Typography>{fileName}</Typography>
          </Stack>
        ) : (
          <>
            <CloudUploadIcon
              sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
            />
            <Typography color="text.secondary">
              {isUploading
                ? "Uploading..."
                : "Click to upload a new resume (PDF)"}
            </Typography>
          </>
        )}
      </Box>
      {uploadMsg && (
        <Alert severity={uploadMsg.severity} sx={{ mb: 2 }}>
          {uploadMsg.text}
        </Alert>
      )}

      <TextField
        label="About me"
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        fullWidth
        multiline
        rows={4}
        placeholder="Any extra information you'd like the autopilot to know about you..."
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ mb: 3 }}
      />
    </SectionWrapper>
  );
}

function DetailsSection({ data, updateSettings }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    linkedin_url: "",
    github_url: "",
    website_url: "",
    portfolio_url: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        first_name: data.form.first_name ?? "",
        last_name: data.form.last_name ?? "",
        email: data.form.email ?? "",
        phone: data.form.phone ?? "",
        address: data.form.address ?? "",
        city: data.form.city ?? "",
        state: data.form.state ?? "",
        country: data.form.country ?? "",
        zip_code: data.form.zip_code ?? "",
        linkedin_url: data.form.linkedin_url ?? "",
        github_url: data.form.github_url ?? "",
        website_url: data.form.website_url ?? "",
        portfolio_url: data.form.portfolio_url ?? "",
      });
    }
  }, [data]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleUpdate() {
    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    const result = await updateSettings({
      ...data,
      form: { ...data.form, ...form },
    });
    setIsUpdating(false);
    if (result.error) {
      setError("Failed to update personal details.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <SectionWrapper
      onUpdate={handleUpdate}
      isUpdating={isUpdating}
      error={error}
      success={success}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Personal Details
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="First name"
            value={form.first_name}
            onChange={handleChange("first_name")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Last name"
            value={form.last_name}
            onChange={handleChange("last_name")}
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
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Phone"
            value={form.phone}
            onChange={handleChange("phone")}
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
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="City"
            value={form.city}
            onChange={handleChange("city")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="State"
            value={form.state}
            onChange={handleChange("state")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Country"
            value={form.country}
            onChange={handleChange("country")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Zip code"
            value={form.zip_code}
            onChange={handleChange("zip_code")}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
        Links
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="LinkedIn URL"
            value={form.linkedin_url}
            onChange={handleChange("linkedin_url")}
            fullWidth
            placeholder="https://linkedin.com/in/yourprofile"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="GitHub URL"
            value={form.github_url}
            onChange={handleChange("github_url")}
            fullWidth
            placeholder="https://github.com/yourusername"
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
    </SectionWrapper>
  );
}

function WorkSection({ data, updateSettings }) {
  const [configForm, setConfigForm] = useState({
    remote: false,
    hybrid: false,
    on_site: false,
  });
  const [form, setForm] = useState({
    legally_authorized: "",
    require_sponsorship: "",
    work_permit_type: "",
    salary: "",
    currency: "",
    salary_range: "",
    current_title: "",
    target_role: "",
    years_of_experience: "",
    education_level: "",
    school: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (data) {
      setConfigForm({
        remote: data.config.remote ?? false,
        hybrid: data.config.hybrid ?? false,
        on_site: data.config.on_site ?? false,
      });
      setForm({
        legally_authorized: data.form.legally_authorized ?? "",
        require_sponsorship: data.form.require_sponsorship ?? "",
        work_permit_type: data.form.work_permit_type ?? "",
        salary: data.form.salary ?? "",
        currency: data.form.currency ?? "",
        salary_range: data.form.salary_range ?? "",
        current_title: data.form.current_title ?? "",
        target_role: joinList(data.form.target_role),
        years_of_experience: data.form.years_of_experience ?? "",
        education_level: data.form.education_level ?? "",
        school: data.form.school ?? "",
      });
    }
  }, [data]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleUpdate() {
    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    const result = await updateSettings({
      ...data,
      config: { ...data.config, ...configForm },
      form: {
        ...data.form,
        ...form,
        target_role: parseList(form.target_role),
      },
    });
    setIsUpdating(false);
    if (result.error) {
      setError("Failed to update work details.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <SectionWrapper
      onUpdate={handleUpdate}
      isUpdating={isUpdating}
      error={error}
      success={success}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Work Details
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Work Authorization
      </Typography>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <FormControl>
          <FormLabel>
            Are you legally authorized to work in the country you are applying?
          </FormLabel>
          <RadioGroup
            row
            value={form.legally_authorized}
            onChange={handleChange("legally_authorized")}
          >
            <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="No" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>

        <FormControl>
          <FormLabel>
            Will you now or in the future require sponsorship?
          </FormLabel>
          <RadioGroup
            row
            value={form.require_sponsorship}
            onChange={handleChange("require_sponsorship")}
          >
            <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="No" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>

        <FormControl>
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
              checked={configForm.remote}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  remote: e.target.checked,
                }))
              }
            />
          }
          label="Remote"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={configForm.hybrid}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  hybrid: e.target.checked,
                }))
              }
            />
          }
          label="Hybrid"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={configForm.on_site}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  on_site: e.target.checked,
                }))
              }
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
            placeholder="Python Developer, Backend Engineer"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Years of experience"
            type="number"
            value={form.years_of_experience}
            onChange={handleChange("years_of_experience")}
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
    </SectionWrapper>
  );
}

function SkillsSection({ data, updateSettings }) {
  const [form, setForm] = useState({
    programming_languages: "",
    frameworks: "",
    tools: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        programming_languages: joinList(data.form.programming_languages),
        frameworks: joinList(data.form.frameworks),
        tools: joinList(data.form.tools),
      });
    }
  }, [data]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleUpdate() {
    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    const result = await updateSettings({
      ...data,
      form: {
        ...data.form,
        programming_languages: parseList(form.programming_languages),
        frameworks: parseList(form.frameworks),
        tools: parseList(form.tools),
      },
    });
    setIsUpdating(false);
    if (result.error) {
      setError("Failed to update skills.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <SectionWrapper
      onUpdate={handleUpdate}
      isUpdating={isUpdating}
      error={error}
      success={success}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Skills
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Separate each item with a comma.
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
    </SectionWrapper>
  );
}

function LlmSection({ data, updateSettings }) {
  const [form, setForm] = useState({
    openai_api_key: "",
    gemini_api_key: "",
    claude_api_key: "",
    local_llm_path: "",
    local_llm_model: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        openai_api_key: data.config.openai_api_key ?? "",
        gemini_api_key: data.config.gemini_api_key ?? "",
        claude_api_key: data.config.claude_api_key ?? "",
        local_llm_path: data.config.local_llm_path ?? "",
        local_llm_model: data.config.local_llm_model ?? "",
      });
    }
  }, [data]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleUpdate() {
    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    const result = await updateSettings({
      ...data,
      config: { ...data.config, ...form },
    });
    setIsUpdating(false);
    if (result.error) {
      setError("Failed to update LLM settings.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <SectionWrapper
      onUpdate={handleUpdate}
      isUpdating={isUpdating}
      error={error}
      success={success}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        LLM
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
    </SectionWrapper>
  );
}

function SettingsPage() {
  const { data, isLoading, error } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();
  const [tab, setTab] = useState(0);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to load settings. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 4, mt: 3 }}>
      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_e, v) => setTab(v)}
        TabIndicatorProps={{ sx: { display: "none" } }}
        sx={{ minWidth: 180 }}
      >
        {["LinkedIn", "Profile", "Details", "Work", "Skills", "LLM"].map(
          (label, i) => (
            <Tab
              key={label}
              label={label}
              sx={{
                textTransform: "none",
                alignItems: "flex-start",
                fontWeight: tab === i ? 600 : 400,
                borderRadius: 1,
                mb: 0.5,
                bgcolor: tab === i ? "action.selected" : "transparent",
                "&:hover": { bgcolor: "action.hover" },
              }}
            />
          )
        )}
      </Tabs>
      <Box sx={{ flex: 1 }}>
        {tab === 0 && (
          <LinkedInSection data={data} updateSettings={updateSettings} />
        )}
        {tab === 1 && (
          <ProfileSection data={data} updateSettings={updateSettings} />
        )}
        {tab === 2 && (
          <DetailsSection data={data} updateSettings={updateSettings} />
        )}
        {tab === 3 && (
          <WorkSection data={data} updateSettings={updateSettings} />
        )}
        {tab === 4 && (
          <SkillsSection data={data} updateSettings={updateSettings} />
        )}
        {tab === 5 && (
          <LlmSection data={data} updateSettings={updateSettings} />
        )}
      </Box>
    </Box>
  );
}

export default SettingsPage;
