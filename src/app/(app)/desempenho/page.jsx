"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
} from "@mui/material";
import PerformanceSummary from "../../components/PerformanceSummary";
import StudentPerformanceChart from "../../components/StudentPerformanceChart";
import CourseSelect from "../../components/CourseSelect";

export default function DesempenhoPage() {

  const [selectedCourse, setSelectedCourse] = useState('nenhum');
  const [courses, setCourses] = useState([{ id: 'nenhum', name: 'Nenhum' }]);
  const [dataByCourse, setDataByCourse] = useState({
    no_course_selected: {
      examsLabels: [],
      examsScores: [],
      listsLabels: [],
      listsScores: [],
      combinedLabels: [],
      combinedScores: [],
    },
  });

  useEffect(() => {
    async function fetchDesempenho() {
      let json = {};
      try {
        const res = await fetch('/api/desempenho');
        if (res && res.ok) {
          json = await res.json();
        }
      } catch (e) {
        // Silencia erro, json permanece vazio
      }
      // Montar lista de cursos para o select
      const apiCourses = json.cursos?.map(c => ({ id: c.id, name: c.nome })) || [];
      setCourses([{ id: 'nenhum', name: 'Nenhum' }, ...apiCourses]);

      // Montar dados dos gráficos por curso
      const data = { no_course_selected: {
        examsLabels: [], examsScores: [], listsLabels: [], listsScores: [], combinedLabels: [], combinedScores: []
      }};
      for (const curso of json.cursos || []) {
        // Aqui você pode adaptar para usar os dados reais do endpoint
        // Exemplo: buscar json.graficosPorCurso[curso.id] se o backend retornar assim
        data[curso.id] = json.graficosPorCurso?.[curso.id] || {
          examsLabels: [], examsScores: [], listsLabels: [], listsScores: [], combinedLabels: [], combinedScores: []
        };
      }
      setDataByCourse(data);
    }
    fetchDesempenho();
  }, []);

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