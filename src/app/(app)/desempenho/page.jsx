"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
} from "@mui/material";
import PerformanceSummary from "../../components/PerformanceSummary";
import StudentPerformanceChart from "../../components/StudentPerformanceChart";
import CourseSelect from "../../components/CourseSelect";

export default function DesempenhoPage() {
  const [selectedCourse, setSelectedCourse] = useState('todos');

  const courses = [
    { id: 'nenhum', name: 'Nenhum' },
    { id: 'logicaprogramacao', name: 'Lógica de Programação' },
    { id: 'calculo', name: 'Cálculo I' },
    { id: 'fisica', name: 'Física Geral' },
  ];

  // Exemplos de dados (devem ser conectados à API)
  const dataByCourse = {
    no_course_selected: {
      examsLabels: [],
      examsScores: [],
      listsLabels: [],
      listsScores: [],
      combinedLabels: [],
      combinedScores: [],
    },
    logicaprogramacao: {
      examsLabels: ['Prova 1', 'Prova 2', 'Prova 3'],
      examsScores: [72, 78, 91],
      listsLabels: ['Lista 1', 'Lista 2'],
      listsScores: [85, 88],
      combinedLabels: ['Prova 1', 'Lista 1', 'Prova 2', 'Lista 2', 'Prova 3'],
      combinedScores: [72, 85, 78, 88, 91],
    },
    calculo: {
      examsLabels: ['Prova 1', 'Prova 2', 'Prova 3'],
      examsScores: [68, 74, 80],
      listsLabels: ['Lista 1', 'Lista 2', 'Lista 3', 'Lista 4'],
      listsScores: [82, 86, 51, 23],
      combinedLabels: ['Prova 1', 'Lista 1', 'Prova 2', 'Lista 2', 'Prova 3', 'Lista 3', 'Lista 4'],
      combinedScores: [68, 82, 74, 86, 80, 51, 23],
    },
    fisica: {
      examsLabels: ['Prova 1', 'Prova 2', 'Prova 3'],
      examsScores: [79, 85, 77],
      listsLabels: ['Lista 1', 'Lista 2', 'Lista 3', 'Lista 4'],
      listsScores: [88, 90, 100, 45],
      combinedLabels: ['Prova 1', 'Lista 1', 'Prova 2', 'Lista 2', 'Prova 3', 'Lista 3', 'Lista 4'],
      combinedScores: [79, 88, 85, 90, 77],
    },
  };

  const active = dataByCourse[selectedCourse] || dataByCourse.no_course_selected;

  // Dados para a nota geral (Podem ser implementados pesos para as listas/provas no futuro)
  const combinedLabels = active.combinedLabels;
  const combinedScores = active.combinedScores;

  // Dados para os gráficos
  const examsLabels = active.examsLabels;
  const examsScores = active.examsScores;

  const listsLabels = active.listsLabels;
  const listsScores = active.listsScores;

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
        width: "100%",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 4, fontWeight: "bold", color: "text.primary", textAlign: "left" }}
      >
        Desempenho
      </Typography>

      <Box
        sx={{
          width: "100%",
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gridAutoRows: "min-content",
          alignItems: "stretch",
        }}
      >
        <Box sx={{ gridColumn: { xs: "1", md: "1" }, gridRow: "1", width: "100%" }}>
          <PerformanceSummary average={average} best={best} latest={latest} />
        </Box>

        <Box sx={{ gridColumn: { xs: "1", md: "2" }, gridRow: "1", width: "100%" }}>
          <CourseSelect
            courses={courses}
            selectedCourse={selectedCourse}
            onCourseChange={setSelectedCourse}
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "1", md: "1" }, gridRow: "2", width: "100%" }}>
          <StudentPerformanceChart
            labels={examsLabels}
            scores={examsScores}
            text={"Provas"}
            height={520}
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "1", md: "2" }, gridRow: "2", width: "100%" }}>
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