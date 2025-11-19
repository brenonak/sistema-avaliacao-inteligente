'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassroomCard from '../../../components/ClassroomCard';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Calendar from '../../../components/Calendar';
import {
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import { Add, School } from '@mui/icons-material';
import PerformanceSummary from "../../../components/PerformanceSummary";
import StudentPerformanceChart from "../../../components/StudentPerformanceChart";
import PendingActivities from "../../../components/PendingActivities";

export default function DashboardPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState('');

  // Exemplos de dados (devem ser conectados à API)
  const data = {
    labels: ['1° Semestre', '2° Semestre', '3° Semestre', '4° Semestre', '5° Semestre', '6° Semestre'],
    scores: [94, 85, 78, 88, 91, 85],
  };

  // Dados para as notas
  const dataLabels = data.labels;
  const dataScores = data.scores;


  // Valores para o resumo de desempenho
  const average = dataScores[dataScores.length - 1];
  const best = Math.max(...dataScores);
  const latest = 81;
  
  // Dados mockados para as atividades pendentes
  const pendingActivities = [
    { title: "Lista 3 de Cálculo", due: "Entrega: 22/11" },
    { title: "Exercícios de Algoritmos", due: "Entrega: 24/11" },
    { title: "Trabalho de Física 1", due: "Entrega: 28/11" },
  ];


  useEffect(() => {
    async function fetchCursos() {
      try {
        // TODO: ajustar a API para retornar apenas os cursos do aluno logado
        const res = await fetch('/api/cursos');
        if (!res.ok) throw new Error('Erro ao carregar cursos');
        const json = await res.json();

        // Ordenar cursos por quantidade de questões (decrescente) e pegar os 6 primeiros
        const cursosOrdenados = (json.itens || [])
          .sort((a, b) => (b.questoesCount || 0) - (a.questoesCount || 0))
          .slice(0, 6);

        setCursos(cursosOrdenados);
      } catch (err) {
        setError(err.message || 'Erro desconhecido');
        setCursos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCursos();
  }, []);

  function handleOpenAddDialog() {
    setCourseIdInput('');
    setOpenAddDialog(true);
  }

  function handleCloseAddDialog() {
    setOpenAddDialog(false);
  }

  async function handleSubmitCourse() {
    try {
      // TODO: implementar a lógica de adicionar uma turma pelo ID
      handleCloseAddDialog();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <Grid container sx={{ backgroundColor: 'background.default' }}>
        <Grid size={8}>
          <Box sx={{
            padding: 5,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography gutterBottom variant="h4" component="div">
                  Meus Cursos
                </Typography>
              </Box>
              {/* TODO: mudar o link para os cursos do aluno */ }
              <Link href="/cursos" passHref style={{ textDecoration: 'none' }}>
                <Button variant="text" size="small">
                  Ver todos
                </Button>
              </Link>
            </Box>

            {loading && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                p: 4,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                mb: 4
              }}>
                <CircularProgress size={30} />
                <Typography sx={{ ml: 2, color: 'text.secondary' }}>Carregando...</Typography>
              </Box>
            )}

            {error && (
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'background.paper',
                borderRadius: 2,
                textAlign: 'center',
                mb: 4
              }}>
                <Typography color="error">
                  {error}
                </Typography>
              </Box>
            )}

            {!loading && !error && cursos.length === 0 && (
              <Box sx={{ 
                textAlign: 'center', 
                p: 4,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                mb: 4
              }}>
                <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                  Nenhum curso cadastrado ainda.
                </Typography>
                <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAddDialog}>
                  Adicionar um curso  
                </Button>
              </Box>
            )}

            {!loading && !error && cursos.length > 0 && (
              <Grid container rowSpacing={4} columnSpacing={4} sx={{
                backgroundColor: 'background.paper',
                padding: 3,
                borderRadius: 2,
                mb: 4
              }}>
                {cursos.map((curso) => (
                  <Grid size={4} key={curso.id}>
                    <ClassroomCard
                      imgSrc="/blue_bg.jpg"
                      imgTitle="Course Background"
                      classroomTitle={curso.nome}
                      teacherName=""
                      cursoId={curso.id}
                      cursoDescricao={curso.descricao}
                      questoesCount={curso.questoesCount}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
            
            <Box>
              <Typography gutterBottom variant="h4" component="div">
                Minhas Notas
              </Typography>
            </Box>
            
            <Box
              sx={{
                width: "100%",
                display: "grid",
                gap: 3,
                gridTemplateColumns: { xs: "1fr", md: "1fr" },
                gridAutoRows: "min-content",
                alignItems: "stretch",
                mt: 4
              }}
            >
              <Box sx={{ gridColumn: { xs: "1", md: "1" }, gridRow: "1", width: "100%" }}>
                <PerformanceSummary average={average} best={best} latest={latest} />
              </Box>

              <Box sx={{ gridColumn: { xs: "1", md: "1" }, gridRow: "2", width: "100%" }}>
                <StudentPerformanceChart
                  labels={dataLabels}
                  scores={dataScores}
                  text={"Evolução do desempenho"}
                  height={520}
                />
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid size={4}>
          <Box sx={{ padding: 5 }}>
            <Typography gutterBottom variant="h4" component="div">
              Agenda
            </Typography>
            <Card sx={{ mb: 4, borderRadius: 2 }}>
              <CardContent>
                <Calendar />
              </CardContent>
            </Card>

            <Typography gutterBottom variant="h4" component="div">
              Atividades Pendentes
            </Typography>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <PendingActivities activities={pendingActivities} />
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiPaper-root': {
            width: 'min(5 00px, 95%)',
            maxWidth: '500px',
            borderRadius: 2,
            p: 2,
          },
        }}
      >
        <DialogTitle>Adicionar Curso</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Código do Curso (feature não implementada)"
            fullWidth
            value={courseIdInput}
            onChange={(e) => setCourseIdInput(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button onClick={handleCloseAddDialog} color="inherit">
              Cancelar
            </Button>

            <Button onClick={handleSubmitCourse} variant="contained">
              Confirmar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}