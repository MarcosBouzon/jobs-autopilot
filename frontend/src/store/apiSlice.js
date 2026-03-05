import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Job", "Applied", "Settings"],
  endpoints: (builder) => ({
    // ── Queries ──────────────────────────────────────────────────────────

    /** GET /api/jobs/ */
    getJobs: builder.query({
      query: () => "jobs/",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Job", id })),
              { type: "Job", id: "LIST" },
            ]
          : [{ type: "Job", id: "LIST" }],
    }),

    /** GET /api/jobs/<ID>/ */
    getJob: builder.query({
      query: (id) => `jobs/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Job", id }],
    }),

    /** GET /api/applied/ */
    getApplied: builder.query({
      query: () => "applied/",
      providesTags: [{ type: "Applied", id: "LIST" }],
    }),

    /** GET /api/settings/ */
    getSettings: builder.query({
      query: () => "settings/",
      providesTags: ["Settings"],
    }),

    // ── Mutations (POST) ─────────────────────────────────────────────────

    /** POST /api/score/<ID>/ */
    scoreJob: builder.mutation({
      query: (id) => ({ url: `score/${id}/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Job", id }],
    }),

    /** POST /api/apply/<ID>/ */
    applyJob: builder.mutation({
      query: (id) => ({ url: `apply/${id}/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Job", id },
        { type: "Applied", id: "LIST" },
      ],
    }),

    /** PATCH /api/settings/ */
    updateSettings: builder.mutation({
      query: (body) => ({ url: "settings/", method: "PATCH", body }),
      invalidatesTags: ["Settings"],
    }),

    // ── Mutations (DELETE) ───────────────────────────────────────────────

    /** DELETE /api/jobs/<ID>/ */
    deleteJob: builder.mutation({
      query: (id) => ({ url: `jobs/${id}/`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Job", id },
        { type: "Job", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobQuery,
  useGetAppliedQuery,
  useGetSettingsQuery,
  useScoreJobMutation,
  useApplyJobMutation,
  useUpdateSettingsMutation,
  useDeleteJobMutation,
} = api;
