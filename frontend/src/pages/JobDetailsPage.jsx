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
import Tooltip from "@mui/material/Tooltip";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useGetJobQuery, useApplyJobMutation, useDeleteJobMutation } from "../store/apiSlice.js";

function decodeHtmlEntities(str) {
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useGetJobQuery(id);
  const [applyJob] = useApplyJobMutation();
  const [deleteJob] = useDeleteJobMutation();

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
            {job.resume_path && (
              <Tooltip title="Tailored resume generated">
                <DescriptionOutlinedIcon fontSize="small" color="success" />
              </Tooltip>
            )}
            <Chip
              label={job.applied ? "Applied" : "Not Applied"}
              color={job.applied ? "success" : "default"}
              size="small"
            />
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          {!job.applied && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => applyJob({ id: job._id })}
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
              <Button
                variant="contained"
                color="success"
                onClick={() => applyJob({ id: job._id, manual: true })}
              >
                Mark Applied
              </Button>
            </>
          )}
          <Tooltip title="Delete">
            <Button
              variant="contained"
              color="error"
              onClick={() => deleteJob(job._id).then(() => navigate("/"))}
              sx={{ minWidth: "auto", px: 1 }}
            >
              <DeleteOutlinedIcon />
            </Button>
          </Tooltip>
        </Stack>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {job.reasoning && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: "action.hover" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Score Reason
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {job.reasoning}
          </Typography>
        </Paper>
      )}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Job Description
        </Typography>
        <Box
          sx={{ "& img": { maxWidth: "100%" } }}
          dangerouslySetInnerHTML={{
            __html: decodeHtmlEntities(job.description),
          }}
        />
      </Paper>
    </>
  );
}

export default JobDetailsPage;
