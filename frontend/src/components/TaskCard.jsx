import { useNavigate } from "react-router";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import { useTaskStream, STATUS, STATUS_CHIP } from "../hooks/useTaskStream.js";

function LiveDot() {
  return (
    <Box
      component="span"
      sx={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        bgcolor: "success.main",
        display: "inline-block",
        animation: "pulse 1.4s ease-in-out infinite",
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
      }}
    />
  );
}

/**
 * @param {{ taskId: string, jobName?: string, company?: string }} props
 */
function TaskCard({ taskId, jobName, company }) {
  const navigate = useNavigate();
  const { status, frame } = useTaskStream(taskId);
  const chip = STATUS_CHIP[status];

  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea onClick={() => navigate(`/live/${taskId}`)} sx={{ height: "100%" }}>
        {/* Thumbnail */}
        <Box
          sx={{
            width: "100%",
            aspectRatio: "16 / 10",
            bgcolor: "action.hover",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {frame ? (
            <Box
              component="img"
              src={frame}
              alt="Task thumbnail"
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <Box sx={{ textAlign: "center", color: "text.disabled" }}>
              {status === STATUS.CONNECTING && <CircularProgress size={24} />}
              {status === STATUS.ERROR && (
                <Typography variant="caption">No connection</Typography>
              )}
              {status === STATUS.TIMEOUT && (
                <Typography variant="caption">No frames</Typography>
              )}
              {status === STATUS.DONE && (
                <Typography variant="caption">Finished</Typography>
              )}
            </Box>
          )}

          {/* Status chip overlay */}
          <Box sx={{ position: "absolute", top: 8, right: 8 }}>
            <Chip
              label={chip.label}
              color={chip.color}
              size="small"
              icon={status === STATUS.STREAMING ? <LiveDot /> : undefined}
              sx={{ fontWeight: 600, fontSize: "0.7rem" }}
            />
          </Box>
        </Box>

        <CardContent sx={{ pb: "12px !important" }}>
          <Typography variant="subtitle2" noWrap>
            {jobName ?? "Applying…"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {company ?? taskId}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default TaskCard;
