import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// AQEDARTFYJMECGE8AAABnNKsSIMAAAGc9rjMg04AzmkvrRCh-Sl0KcsT28BJLAK1xrnLzeGYhdHxVs_1kr2vRoFAIVMxDmVN5_1WD6DuycurMWKIEo5dsMTPIxtYNg5y0gObR1fLVSsHe20k4hdTiyGA
// AQGqfVqJdTnFBQAAAZzSboH0hmVcF5kU1a3LOrbf0Nb3FSloaBT66kKSoEf6ECA0vHdNTfVDoE2rHX4V_igoxomAv8d5SRWqpaJZCMdthwtkhQYJIhy4phm2BdHBavYotn49XxIGWD_KBwqTDP4ykYVlhwSSaIub1T0YUM80hoymbFM89Tgm_8R8PH2Ihnah0YvyxIWRkBsTMBEYe4gofcBVU6ol_nx8gWfGhwY-Dwn-vcvZM92RHX1e1n3VX4HGQFg5pSsEDz5x3JxswDdO-eeYDlqeoZ0u_tY1AdxpHGfUwcPlmamggdiJgF4U_UDrfis3SL4Nldwkw2ooEGmZwQ
// "ajax:3026106764719428202"

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Job", "Settings"],
  endpoints: (builder) => ({
    getJobs: builder.query({
      query: (applied) => {
        const params = new URLSearchParams();
        if (applied !== undefined) params.set("applied", applied);
        const qs = params.toString();
        return qs ? `jobs/?${qs}` : "jobs/";
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: "Job", id: _id })), { type: "Job", id: "LIST" }]
          : [{ type: "Job", id: "LIST" }],
    }),

    getJob: builder.query({
      query: (id) => `jobs/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Job", id }],
    }),

    getSettings: builder.query({
      query: () => "settings/",
      providesTags: ["Settings"],
    }),

    scoreJob: builder.mutation({
      query: (id) => ({ url: `score/${id}/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Job", id },
        { type: "Job", id: "LIST" },
      ],
    }),

    applyJob: builder.mutation({
      query: (id) => ({ url: `apply/${id}/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Job", id },
        { type: "Job", id: "LIST" },
      ],
    }),

    updateSettings: builder.mutation({
      query: (body) => ({ url: "settings/", method: "PATCH", body }),
      invalidatesTags: ["Settings"],
    }),

    deleteJob: builder.mutation({
      query: (id) => ({ url: `jobs/${id}/`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Job", id },
        { type: "Job", id: "LIST" },
      ],
    }),

    uploadResume: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: "resume/", method: "POST", body: formData };
      },
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobQuery,
  useGetSettingsQuery,
  useScoreJobMutation,
  useApplyJobMutation,
  useUpdateSettingsMutation,
  useDeleteJobMutation,
  useUploadResumeMutation,
} = api;
