'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassroomCard from '../../components/ClassroomCard';   
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Calendar from '../../components/Calendar';
import { CircularProgress, Button } from '@mui/material';
import { Add, School } from '@mui/icons-material';

export default function DashboardPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCursos() {
      try {
        const res = await fetch('/api/cursos');
        if (!res.ok) throw new Error('Erro ao carregar cursos');
        const json = await res.json();
        // Limitar a 6 cursos mais recentes no dashboard
        setCursos((json.itens || []).slice(0, 6));
      } catch (err) {
        setError(err.message || 'Erro desconhecido');
        setCursos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCursos();
  }, []);

  return (
    <Grid container sx={{ backgroundColor: 'background.default' }}>
      <Grid size={8}>
        <Box sx={{
          padding: 5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography gutterBottom variant="h4" component="div">
              Meus Cursos
            </Typography>
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
              borderRadius: 2
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
              textAlign: 'center'
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
              borderRadius: 2
            }}>
              <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                Nenhum curso cadastrado ainda.
              </Typography>
              <Link href="/cursos/criar" passHref style={{ textDecoration: 'none' }}>
                <Button variant="contained" color="primary" startIcon={<Add />}>
                  Criar Primeiro Curso
                </Button>
              </Link>
            </Box>
          )}

          {!loading && !error && cursos.length > 0 && (
            <Grid container rowSpacing={4} columnSpacing={4} sx={{
              backgroundColor: 'background.paper',
              padding: 3,
              borderRadius: 2
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
        </Box>
      </Grid>
      <Grid size={4}>
        <Box sx={{
          padding: 5,
        }}>
          <Typography gutterBottom variant="h4" component="div">
            Agenda
          </Typography>
          <Box sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
            maxWidth: 320,
          }}>
            <Calendar />
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}