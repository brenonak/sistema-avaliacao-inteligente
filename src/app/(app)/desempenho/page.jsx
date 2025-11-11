"use client";

import {
  Box,
  Typography,
} from "@mui/material";
import PerformanceSummary from "../../components/PerformanceSummary";
import StudentPerformanceChart from "../../components/StudentPerformanceChart";

export default function DesempenhoPage() {
  // Dados para a nota geral (Podem ser implementados pesos para as listas/provas no futuro)
  const combinedLabels = ['Prova 1', 'Lista 1', 'Prova 2', 'Lista 2', 'Prova 3'];
  const combinedScores = [72, 85, 78, 88, 91];

  // Dados para os gráficos
  const examsLabels = ['Prova 1', 'Prova 2', 'Prova 3', 'Prova 4', 'Prova 5'];
  const examsScores = [72, 78, 91, 51, 63];

  const listsLabels = ['Lista 1', 'Lista 2', 'Lista 3', 'Lista 4'];
  const listsScores = [85, 88, 92, 79];

  // Valores para o resumo de desempenho
  const average = combinedScores.reduce((a, b) => a + b, 0) / combinedScores.length;
  const best = Math.max(...combinedScores);
  const latest = combinedScores[combinedScores.length - 1];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",         
        p: 3,
        backgroundColor: "background.default",
        mx: "auto",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 4, fontWeight: "bold", color: "text.primary", textAlign: "left" }}
      >
        Desempenho
      </Typography>

      <PerformanceSummary average={average} best={best} latest={latest} />

      <Box
        sx={{
          mt: 4,
          width: "100%",
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, 
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: "100%" }}>
          <StudentPerformanceChart
            labels={examsLabels}
            scores={examsScores}
            text={"Provas"}
            height={520}
          />
        </Box>

        <Box sx={{ width: "100%" }}>
          <StudentPerformanceChart
            labels={listsLabels}
            scores={listsScores}
            text={"Listas de Exercícios"}
            height={520}
          />
        </Box>
      </Box>
    </Box>
  );
}