import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { Navigate } from "react-router";
import { useGetSettingsQuery } from "../store/apiSlice.js";

function RequireSetup({ children }) {
  const { data, isLoading, isError } = useGetSettingsQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const linkedin = data?.config?.li_at && data?.config?.li_rm && data?.config?.jsession_id;

  if (isError || !linkedin) {
    return <Navigate to="/setup" replace />;
  }

  return children;
}

export default RequireSetup;
