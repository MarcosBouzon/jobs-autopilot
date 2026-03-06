import { Routes, Route } from "react-router";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Navbar from "./components/Navbar.jsx";
import RequireSetup from "./components/RequireSetup.jsx";
import HomePage from "./pages/HomePage.jsx";
import JobDetailsPage from "./pages/JobDetailsPage.jsx";
import AppliedPage from "./pages/AppliedPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import LivePage from "./pages/LivePage.jsx";
import LiveDetailPage from "./pages/LiveDetailPage.jsx";
import SetupPage from "./pages/SetupPage.jsx";

function AppLayout() {
  return (
    <RequireSetup>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/details/:id" element={<JobDetailsPage />} />
            <Route path="/applied" element={<AppliedPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/live/:taskId" element={<LiveDetailPage />} />
          </Routes>
        </Container>
      </Box>
    </RequireSetup>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}

export default App;
