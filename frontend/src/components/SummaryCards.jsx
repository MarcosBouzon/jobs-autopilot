import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

const CARD_CONFIG = [
  { label: "Total Jobs", key: "total", color: "primary.main" },
  { label: "Total Scored", key: "scored", color: "info.main" },
  { label: "Total Tailored", key: "tailored", color: "warning.main" },
  { label: "Total Applied", key: "applied", color: "success.main" },
];

function SummaryCards({ summary }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {CARD_CONFIG.map((card) => (
        <Grid key={card.key} size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h4" sx={{ color: card.color }}>
                {summary[card.key]}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default SummaryCards;
