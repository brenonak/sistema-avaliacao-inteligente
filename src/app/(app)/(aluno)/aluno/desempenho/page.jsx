"use client";
import React, { useState, useEffect } from "react";
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
  const [courses, setCourses] = useState([{ id: 'nenhum', name: 'Nenhum' }]);
  const [dataByCourse, setDataByCourse] = useState({
    no_course_selected: {
      examsLabels: [],
      examsScores: [],
      listsLabels: [],
      listsScores: [],
      combinedLabels: [],
      combinedScores: [],
      history: []
    },
  });

  useEffect(() => {
    async function fetchDesempenho() {
      const res = await fetch('/api/desempenho');
      if (!res.ok) return;
      const json = await res.json();
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