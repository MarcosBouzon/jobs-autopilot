import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import JobsTable from "../components/JobsTable.jsx";
import { useGetJobsQuery } from "../store/apiSlice.js";

function AppliedPage() {
  const { data: jobs, isLoading, error } = useGetJobsQuery(true);

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
        Failed to load applied jobs: {error.status}
      </Alert>
    );
  }

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Applied Jobs ({jobs.length})
      </Typography>
      <JobsTable jobs={jobs} detailsOnly emptyMessage="No applied jobs yet." />
    </>
  );
}

export default AppliedPage;
