import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import SummaryCards from "../components/SummaryCards.jsx";
import JobsTable from "../components/JobsTable.jsx";
import { useGetJobsQuery } from "../store/apiSlice.js";

function getSummary(jobs) {
  return {
    total: jobs.length,
    scored: jobs.filter((j) => j.score > 0).length,
    tailored: jobs.filter((j) => j.score >= 7).length,
    applied: jobs.filter((j) => j.applied).length,
  };
}

function HomePage() {
  const { data: jobs, isLoading, error } = useGetJobsQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Failed to load jobs: {error.status} {error.data?.detail ?? ""}
      </Alert>
    );
  }

  const summary = getSummary(jobs);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Job Listings
      </Typography>
      <SummaryCards summary={summary} />
      <JobsTable jobs={jobs} />
    </>
  );
}

export default HomePage;
