"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import Link from "next/link";
import PerformanceSummary from "../../../../components/PerformanceSummary";
import StudentPerformanceChart from "../../../../components/StudentPerformanceChart";
import CourseSelect from "../../../../components/CourseSelect";

export default function DesempenhoPage() {
  const [selectedCourse, setSelectedCourse] = useState('nenhum');

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
      history: []
    },
    logicaprogramacao: {
      examsLabels: ['Prova 1', 'Prova 2', 'Prova 3'],
      examsScores: [72, 78, 91],
      listsLabels: ['Lista 1', 'Lista 2'],
      listsScores: [85, 88],
      combinedLabels: ['Prova 1', 'Lista 1', 'Prova 2', 'Lista 2', 'Prova 3'],
      combinedScores: [72, 85, 78, 88, 91],
      history: [
        { id: 'p1', type: 'Prova', title: 'Prova 1', date: '2023-09-10', score: 7.2, maxScore: 10, status: 'Corrigida' },
        { id: 'l1', type: 'Lista', title: 'Lista 1', date: '2023-09-15', score: 8.5, maxScore: 10, status: 'Corrigida' },
        { id: 'p2', type: 'Prova', title: 'Prova 2', date: '2023-10-10', score: 7.8, maxScore: 10, status: 'Corrigida' },
        { id: 'l2', type: 'Lista', title: 'Lista 2', date: '2023-10-15', score: 8.8, maxScore: 10, status: 'Corrigida' },
        { id: 'p3', type: 'Prova', title: 'Prova 3', date: '2023-11-10', score: 9.1, maxScore: 10, status: 'Corrigida' },
      ]
    },
    calculo: {
      examsLabels: ['Prova 1', 'Prova 2', 'Prova 3'],
      examsScores: [68, 74, 80],
      listsLabels: ['Lista 1', 'Lista 2', 'Lista 3', 'Lista 4'],
      listsScores: [82, 86, 51, 23],
      combinedLabels: ['Prova 1', 'Lista 1', 'Prova 2', 'Lista 2', 'Prova 3', 'Lista 3', 'Lista 4'],
      combinedScores: [68, 82, 74, 86, 80, 51, 23],
      history: [
        { id: 'p1', type: 'Prova', title: 'Prova 1', date: '2023-09-05', score: 6.8, maxScore: 10, status: 'Corrigida' },
        { id: 'l1', type: 'Lista', title: 'Lista 1', date: '2023-09-12', score: 8.2, maxScore: 10, status: 'Corrigida' },
      ]
    },
    fisica: {
      examsLabels: ['Prova 1', 'Prova 2', 'Prova 3'],
      examsScores: [79, 85, 77],
      listsLabels: ['Lista 1', 'Lista 2', 'Lista 3', 'Lista 4'],
      listsScores: [88, 90, 100, 45],
      combinedLabels: ['Prova 1', 'Lista 1', 'Prova 2', 'Lista 2', 'Prova 3', 'Lista 3', 'Lista 4'],
      combinedScores: [79, 88, 85, 90, 77],
      history: []
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

        {/* Histórico Detalhado */}
        {selectedCourse !== 'nenhum' && active.history && active.history.length > 0 && (
          <Box sx={{ gridColumn: { xs: "1", md: "1 / span 2" }, gridRow: "3", width: "100%" }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Histórico de Avaliações
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Avaliação</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {active.history.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{item.title}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${item.score} / ${item.maxScore}`} 
                            color={item.score >= (item.maxScore * 0.6) ? "success" : "error"}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={item.status} color="success" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          {item.type === 'Prova' && (
                            <Button 
                              component={Link}
                              href={`/aluno/cursos/${selectedCourse}/provas/${item.id}/resultado`}
                              variant="contained" 
                              size="small" 
                              startIcon={<Visibility />}
                            >
                              Ver Correção
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}