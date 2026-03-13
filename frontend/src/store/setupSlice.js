import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  linkedin: {
    li_at: "",
    li_rm: "",
    jsession_id: "",
    linkedin_user: "",
    linkedin_pass: "",
  },
  profile: {
    aboutMe: "",
    fileName: "",
  },
  details: {
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
  },
  work: {
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
    remote: false,
    hybrid: false,
    on_site: false,
  },
  skills: {
    programming_languages: "",
    frameworks: "",
    tools: "",
  },
  llm: {
    openai_api_key: "",
    gemini_api_key: "",
    claude_api_key: "",
    local_llm_path: "",
    local_llm_model: "",
  },
};

const setupSlice = createSlice({
  name: "setup",
  initialState,
  reducers: {
    updateLinkedin(state, action) {
      Object.assign(state.linkedin, action.payload);
    },
    updateProfile(state, action) {
      Object.assign(state.profile, action.payload);
    },
    updateDetails(state, action) {
      Object.assign(state.details, action.payload);
    },
    updateWork(state, action) {
      Object.assign(state.work, action.payload);
    },
    updateSkills(state, action) {
      Object.assign(state.skills, action.payload);
    },
    updateLlm(state, action) {
      Object.assign(state.llm, action.payload);
    },
  },
});

export const {
  updateLinkedin,
  updateProfile,
  updateDetails,
  updateWork,
  updateSkills,
  updateLlm,
} = setupSlice.actions;

export default setupSlice.reducer;
