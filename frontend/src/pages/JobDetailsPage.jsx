import { useParams, useNavigate } from "react-router";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useGetJobQuery, useApplyJobMutation } from "../store/apiSlice.js";

function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useGetJobQuery(id);
  const [applyJob] = useApplyJobMutation();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 8 }}>
        <Typography variant="h5">Job not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/")}>
          Back to Jobs
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4">{job.title}</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1, alignItems: "center" }}>
            {job.company && (
              <Typography color="text.secondary">{job.company}</Typography>
            )}
            <Typography color="text.secondary">{job.location}</Typography>
            {job.salary && (
              <Typography color="text.secondary">{job.salary}</Typography>
            )}
            <Typography color="text.secondary">
              Score: {job.score}
            </Typography>
            <Chip
              label={job.applied ? "Applied" : "Not Applied"}
              color={job.applied ? "success" : "default"}
              size="small"
            />
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          {!job.applied && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => applyJob(job._id)}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Manual Apply
              </Button>
            </>
          )}
        </Stack>
      </Box>
      <Divider sx={{ mb: 3 }} />
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Job Description
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {job.description}
        </Typography>
      </Paper>
    </>
  );
}

export default JobDetailsPage;
