import { useState, useMemo, useEffect } from "react";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import SummaryCards from "../components/SummaryCards.jsx";
import JobsTable from "../components/JobsTable.jsx";
import { useGetJobsQuery } from "../store/apiSlice.js";

function getSummary(jobs) {
  return {
    total: jobs.length,
    scored: jobs.filter((j) => j.score > 0).length,
    tailored: jobs.filter((j) => j.resume_path).length,
    applied: jobs.filter((j) => j.applied).length,
  };
}

function HomePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [board, setBoard] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: allJobs } = useGetJobsQuery({ applied: false });
  const boards = useMemo(() => {
    if (!allJobs) return [];
    const unique = [...new Set(allJobs.map((j) => j.job_board).filter(Boolean))];
    return unique.sort();
  }, [allJobs]);

  const { data: jobs, isLoading, error } = useGetJobsQuery({
    applied: false,
    search: debouncedSearch,
    board,
  });

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
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search jobs by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          value={board}
          onChange={(e) => setBoard(e.target.value)}
          sx={{ minWidth: 180 }}
          label="Platform"
        >
          <MenuItem value="">All</MenuItem>
          {boards.map((b) => (
            <MenuItem key={b} value={b}>
              {b}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <JobsTable jobs={jobs} />
    </>
  );
}

export default HomePage;
