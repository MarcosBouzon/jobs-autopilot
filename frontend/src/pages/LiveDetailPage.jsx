import { useParams, useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTaskStream, STATUS, STATUS_CHIP, FRAME_TIMEOUT_MS } from "../hooks/useTaskStream.js";

function LiveDot() {
  return (
    <Box
      component="span"
      sx={{
        width: 8,
        height: 8,
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

function LiveDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { status, frame } = useTaskStream(taskId);
  const chip = STATUS_CHIP[status];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={() => navigate("/live")} sx={{ mr: 0.5 }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="h5">Live View</Typography>
        <Chip
          label={chip.label}
          color={chip.color}
          size="small"
          icon={status === STATUS.STREAMING ? <LiveDot /> : undefined}
        />
        {status === STATUS.CONNECTING && <CircularProgress size={16} />}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Task ID: <code>{taskId}</code>
      </Typography>

      <Box
        sx={{
          width: "100%",
          aspectRatio: "16 / 10",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {frame ? (
          <Box
            component="img"
            src={frame}
            alt="Live agent view"
            sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        ) : (
          <Box sx={{ textAlign: "center", color: "text.secondary" }}>
            {status === STATUS.CONNECTING && (
              <>
                <CircularProgress size={32} sx={{ mb: 1 }} />
                <Typography variant="body2">Waiting for stream…</Typography>
              </>
            )}
            {status === STATUS.TIMEOUT && (
              <Typography variant="body2">
                No frames received in {FRAME_TIMEOUT_MS / 1000}s. The agent may have
                finished or the task ID is invalid.
              </Typography>
            )}
            {status === STATUS.ERROR && (
              <Typography variant="body2">
                Could not connect to the backend. Make sure the server is running.
              </Typography>
            )}
            {status === STATUS.DONE && (
              <Typography variant="body2">Stream ended.</Typography>
            )}
          </Box>
        )}
      </Box>

      {status === STATUS.DONE && frame && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Showing last frame. The agent has finished.
        </Typography>
      )}
    </Box>
  );
}

export default LiveDetailPage;
