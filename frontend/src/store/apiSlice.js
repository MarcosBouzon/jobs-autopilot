import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
      query: ({ id, manual = false }) => ({
        url: manual ? `apply/${id}/?manual=true` : `apply/${id}/`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { id }) => [
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
