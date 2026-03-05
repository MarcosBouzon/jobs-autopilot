import Typography from "@mui/material/Typography";
import SummaryCards from "../components/SummaryCards.jsx";
import JobsTable from "../components/JobsTable.jsx";
import { JOBS, getSummary } from "../data/mockData.js";

function HomePage() {
  const summary = getSummary(JOBS);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Job Listings
      </Typography>
      <SummaryCards summary={summary} />
      <JobsTable jobs={JOBS} />
    </>
  );
}

export default HomePage;
