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
import PerformanceSummary from "../../../components/PerformanceSummary";
import StudentPerformanceChart from "../../../components/StudentPerformanceChart";
import CourseSelect from "../../../components/CourseSelect";

export default function DesempenhoPage() {
  const [selectedCourse, setSelectedCourse] = useState('nenhum');
  const [courses, setCourses] = useState([{ id: 'nenhum', name: 'Nenhum' }]);
  const [dataByCourse, setDataByCourse] = useState({
    nenhum: {
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
    async function fetchCourses() {
      try {
        const cursosRes = await fetch('/api/cursos');
        if (!cursosRes.ok) {
          console.error('Erro ao buscar cursos:', cursosRes.status);
          return;
        }
        const cursosData = await cursosRes.json();
        const cursosArray = cursosData.itens || [];
        const apiCourses = cursosArray.map(c => ({ 
          id: c.id, 
          name: c.nome 
        }));
        setCourses([{ id: 'nenhum', name: 'Nenhum' }, ...apiCourses]);
      } catch (error) {
        console.error('Erro ao buscar cursos:', error);
      }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    async function fetchDesempenho() {
      if (selectedCourse === 'nenhum') {
        setDataByCourse(prevData => ({
          ...prevData,
          [selectedCourse]: {
            examsLabels: [], examsScores: [], listsLabels: [], listsScores: [],
            combinedLabels: [], combinedScores: [], history: []
          }
        }));
        return;
      }

      try {
        const cursoDetailsRes = await fetch(`/api/cursos/${selectedCourse}`);
        if (!cursoDetailsRes.ok) {
          console.error(`Erro ao buscar detalhes do curso ${selectedCourse}:`, cursoDetailsRes.status);
          setDataByCourse(prevData => ({
            ...prevData,
            [selectedCourse]: {
              examsLabels: [], examsScores: [], listsLabels: [], listsScores: [],
              combinedLabels: [], combinedScores: [], history: []
            }
          }));
          return;
        }
        
        const cursoDetails = await cursoDetailsRes.json();
        
        const provas = cursoDetails.provas || [];
        const listas = cursoDetails.exercicios || [];
        
        const examsLabels = provas.map((p, i) => p.titulo || `Prova ${i + 1}`);
        const examsScores = provas.map(p => p.valorTotal || 0);
        
        const listsLabels = listas.map((l, i) => l.tituloLista || `Lista ${i + 1}`);
        const listsScores = listas.map(l => {
          if (l.usarPontuacao && l.questoes) {
            return l.questoes.reduce((sum, q) => sum + (q.pontuacao || 0), 0);
          }
          return 0;
        });
        
        const combinedLabels = [...examsLabels, ...listsLabels];
        const combinedScores = [...examsScores, ...listsScores];
        
        const history = [];
        
        provas.forEach(p => {
          history.push({
            id: p._id || p.id,
            type: 'Prova',
            title: p.titulo || 'Prova',
            date: p.data || new Date().toISOString(),
            score: p.valorTotal || 0,
            maxScore: p.valorTotal || 10,
            status: 'Criada'
          });
        });
        
        listas.forEach(l => {
          const totalPontos = l.usarPontuacao && l.questoes 
            ? l.questoes.reduce((sum, q) => sum + (q.pontuacao || 0), 0) 
            : 10;
            
          history.push({
            id: l._id || l.id,
            type: 'Lista',
            title: l.tituloLista || 'Lista de Exercícios',
            date: new Date().toISOString(),
            score: totalPontos,
            maxScore: totalPontos,
            status: 'Criada'
          });
        });
        
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setDataByCourse(prevData => ({
          ...prevData,
          [selectedCourse]: {
            examsLabels,
            examsScores,
            listsLabels,
            listsScores,
            combinedLabels,
            combinedScores,
            history
          }
        }));
        
      } catch (error) {
        console.error('Erro ao buscar dados de desempenho:', error);
        setDataByCourse(prevData => ({
          ...prevData,
          [selectedCourse]: {
            examsLabels: [], examsScores: [], listsLabels: [], listsScores: [],
            combinedLabels: [], combinedScores: [], history: []
          }
        }));
      }
    }
    fetchDesempenho();
  }, [selectedCourse]);

  const active = dataByCourse[selectedCourse] || dataByCourse.nenhum;

  console.log('Selected Course:', selectedCourse);
  console.log('Active Data:', active);
  console.log('History:', active.history);

    // Dados para a nota geral (Podem ser implementados pesos para as listas/provas no futuro)
  const combinedLabels = active.combinedLabels;
  const combinedScores = active.combinedScores;
  // Dados para os gráficos
  const examsLabels = active.examsLabels;
  const examsScores = active.examsScores;
  const listsLabels = active.listsLabels;
  const listsScores = active.listsScores;
  // Valores para o resumo de desempenho
  const average = combinedScores.length > 0 ? combinedScores.reduce((a, b) => a + b, 0) / combinedScores.length : 0;
  const best = combinedScores.length > 0 ? Math.max(...combinedScores) : 0;
  const latest = combinedScores.length > 0 ? combinedScores[combinedScores.length - 1] : 0;
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
                    <TableCell>Nota Média</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCourse === 'nenhum' ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Selecione um curso para ver o histórico de avaliações.
                      </TableCell>
                    </TableRow>
                  ) : active.history && active.history.length > 0 ? (
                    active.history.map((item) => (
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
                              href={`/cursos/${selectedCourse}/provas/${item.id}`}
                              variant="contained" 
                              size="small" 
                              startIcon={<Visibility />}
                            >
                              Ver Prova
                            </Button>
                          )}
                          {item.type === 'Lista' && (
                            <Button 
                              component={Link}
                              href={`/cursos/${selectedCourse}/listas/${item.id}/visualizar`}
                              variant="contained" 
                              size="small" 
                              startIcon={<Visibility />}
                            >
                              Ver Lista
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Nenhuma avaliação encontrada para este curso.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}