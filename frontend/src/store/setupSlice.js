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
    remote: false,
    hybrid: false,
    on_site: false,
  },
  skills: {
    programming_languages: "",
    frameworks: "",
    tools: "",
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
  },
});

export const {
  updateLinkedin,
  updateProfile,
  updateDetails,
  updateWork,
  updateSkills,
} = setupSlice.actions;

export default setupSlice.reducer;
