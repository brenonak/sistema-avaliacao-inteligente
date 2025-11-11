"use client";

import {
  Box,
  Typography,
} from "@mui/material";
import PerformanceSummary from "../../components/PerformanceSummary";
import StudentPerformanceChart from "../../components/StudentPerformanceChart";

export default function DesempenhoPage() {
  const labels = ['Prova 1', 'Lista 1', 'Prova 2', 'Lista 2', 'Prova 3'];
  const scores = [72, 85, 78, 88, 91];

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const best = Math.max(...scores);
  const latest = scores[scores.length - 1];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        backgroundColor: "background.default",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 4, fontWeight: "bold", color: "text.primary", textAlign: "center" }}
      >
        Desempenho
      </Typography>

      <PerformanceSummary average={average} best={best} latest={latest} />

      <Box sx={{ mt: 4 }}>
        <StudentPerformanceChart labels={labels} scores={scores} />
      </Box>
    </Box>
  );
}