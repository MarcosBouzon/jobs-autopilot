import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router";
import {
  useScoreJobMutation,
  useApplyJobMutation,
  useDeleteJobMutation,
} from "../store/apiSlice.js";

function JobsTable({ jobs, detailsOnly = false, emptyMessage = "No jobs to display yet." }) {
  const navigate = useNavigate();
  const [scoreJob] = useScoreJobMutation();
  const [applyJob] = useApplyJobMutation();
  const [deleteJob] = useDeleteJobMutation();

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Salary</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Platform</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {jobs.map((job) => (
            <TableRow key={job._id}>
              <TableCell>{job.title}</TableCell>
              <TableCell>{job.location}</TableCell>
              <TableCell>{job.salary ?? "—"}</TableCell>
              <TableCell>{job.company ?? "—"}</TableCell>
              <TableCell>{job.job_board ?? "—"}</TableCell>
              <TableCell>{job.score}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Details">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/details/${job._id}`)}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {!detailsOnly && (
                    <Tooltip title="Score">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => scoreJob(job._id)}
                      >
                        <StarBorderOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {!detailsOnly && (
                    <Tooltip title="Apply">
                      <IconButton
                        size="small"
                        color="success"
                        disabled={job.applied}
                        onClick={() => applyJob(job._id)}
                      >
                        <SendOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {!detailsOnly && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteJob(job._id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default JobsTable;
