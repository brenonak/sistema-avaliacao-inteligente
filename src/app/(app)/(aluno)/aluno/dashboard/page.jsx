'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassroomCard from '../../../../components/ClassroomCard';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Calendar from '../../../../components/Calendar';
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
import PerformanceSummary from "../../../../components/PerformanceSummary";
import StudentPerformanceChart from "../../../../components/StudentPerformanceChart";
import PendingActivities from "../../../../components/PendingActivities";
import { useTheme } from '@mui/material/styles';

export default function DashboardAlunoPage() {
  const [cursos, setCursos] = useState([]);
  const [stats, setStats] = useState({
    mediaGeral: 0,
    melhorNota: 0,
    ultimaAvaliacao: 0,
    historico: [],
    historicoProvas: [],
    historicoListas: []
  });
  const [pendingActivities, setPendingActivities] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState('');

  // Dados para as notas - separados por tipo (usando título da atividade como label)
  const provasLabels = stats.historicoProvas?.map(h => h.titulo || 'Prova') || [];
  const provasScores = stats.historicoProvas?.map(h => h.nota) || [];
  const listasLabels = stats.historicoListas?.map(h => h.titulo || 'Lista') || [];
  const listasScores = stats.historicoListas?.map(h => h.nota) || [];

  // Valores para o resumo de desempenho (apenas provas)
  const average = stats.mediaGeral ? parseFloat(stats.mediaGeral.toFixed(1)) : 0;
  const best = stats.melhorNota ? parseFloat(stats.melhorNota.toFixed(1)) : 0;
  const latest = stats.ultimaAvaliacao ? parseFloat(stats.ultimaAvaliacao.toFixed(1)) : 0;
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Buscar os cursos em que o aluno está matriculado
        const cursosRes = await fetch('/api/cursos/aluno');
        if (!cursosRes.ok) {
          throw new Error('Erro ao carregar cursos');
        }
        const cursosData = await cursosRes.json();
        setCursos(cursosData.itens || []);

        // Buscar estatísticas de desempenho e atividades pendentes
        const statsRes = await fetch('/api/desempenho');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.studentStats) {
            setStats(statsData.studentStats);
          }
          if (statsData.pendingActivities) {
            setPendingActivities(statsData.pendingActivities);
          }
          if (statsData.calendarEvents) {
            setCalendarEvents(statsData.calendarEvents);
          }
        }

      } catch (err) {
        setError(err.message || 'Erro desconhecido');
        setCursos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleOpenAddDialog() {
    setCourseIdInput('');
    setOpenAddDialog(true);
  }

  function handleCloseAddDialog() {
    setOpenAddDialog(false);
  }

  async function handleSubmitCourse() {
    if (!courseIdInput.trim()) {
      alert('Por favor, insira o código do curso');
      return;
    }

    try {
      const response = await fetch('/api/cursos/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: courseIdInput.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar curso');
      }

      // Recarregar lista de cursos
      const cursosResponse = await fetch('/api/cursos/aluno');
      if (cursosResponse.ok) {
        const cursosData = await cursosResponse.json();
        setCursos(cursosData.itens || []);
      }

      handleCloseAddDialog();
      alert(`Você foi matriculado no curso: ${data.curso.nome}`);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Erro ao adicionar curso');
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
              <Link href="/aluno/cursos" passHref style={{ textDecoration: 'none' }}>
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
                      aluno={true}
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
                  showBothSeries={true}
                  provasLabels={provasLabels}
                  provasScores={provasScores}
                  listasLabels={listasLabels}
                  listasScores={listasScores}
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
                <Calendar iconColor={'accent.secondary'} events={calendarEvents} />
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
            label="Código do Curso"
            placeholder="Digite o código do curso"
            fullWidth
            value={courseIdInput}
            onChange={(e) => setCourseIdInput(e.target.value.toUpperCase())}
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