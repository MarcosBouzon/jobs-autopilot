import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TaskCard from "../components/TaskCard.jsx";

/**
 * Placeholder task list — replace with a real API call (e.g. useGetActiveTasksQuery)
 * once the backend exposes a tasks endpoint.
 *
 * Each entry shape: { taskId: string, jobName: string, company: string }
 */
const MOCK_TASKS = [
  { taskId: "task-abc-001", jobName: "Senior Frontend Engineer", company: "Stripe" },
  { taskId: "task-abc-002", jobName: "React Developer", company: "Toptal" },
  { taskId: "task-abc-003", jobName: "Lead Frontend Developer", company: "Vercel" },
];

function LivePage() {
  const activeTasks = MOCK_TASKS;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 3 }}>
        <Typography variant="h5">Applications in Progress</Typography>
        <Typography variant="body2" color="text.secondary">
          {activeTasks.length} active
        </Typography>
      </Box>

      {activeTasks.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Typography color="text.secondary">No active applications.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {activeTasks.map((task) => (
            <Grid key={task.taskId} size={{ xs: 12, sm: 6, md: 4 }}>
              <TaskCard
                taskId={task.taskId}
                jobName={task.jobName}
                company={task.company}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default LivePage;
