import { useRef } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "../../store/setupSlice.js";

function ProfileStep({ onBack, onNext, resumeFileRef }) {
  const dispatch = useDispatch();
  const { aboutMe, fileName } = useSelector(
    (state) => state.setup.profile
  );
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected?.type === "application/pdf") {
      resumeFileRef.current = selected;
      dispatch(updateProfile({ fileName: selected.name }));
    }
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Your Profile
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Upload your resume so the autopilot can tailor applications on your
        behalf. You can also add extra information about yourself.
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Resume (PDF) *
      </Typography>
      <Box
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: "2px dashed",
          borderColor: fileName ? "success.main" : "divider",
          borderRadius: 2,
          p: 3,
          mb: 3,
          textAlign: "center",
          cursor: "pointer",
          "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleFileChange}
        />
        {fileName ? (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <InsertDriveFileIcon color="success" />
            <Typography>{fileName}</Typography>
          </Stack>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
            <Typography color="text.secondary">
              Click to upload your resume (PDF)
            </Typography>
          </>
        )}
      </Box>

      <TextField
        label="About me (optional)"
        value={aboutMe}
        onChange={(e) => dispatch(updateProfile({ aboutMe: e.target.value }))}
        fullWidth
        multiline
        minRows={4}
        maxRows={20}
        placeholder="Any extra information you'd like the autopilot to know about you — skills, preferences, experience highlights..."
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ mb: 3 }}
      />

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!resumeFileRef.current && !fileName}
        >
          Next
        </Button>
      </Stack>
    </Box>
  );
}

export default ProfileStep;
