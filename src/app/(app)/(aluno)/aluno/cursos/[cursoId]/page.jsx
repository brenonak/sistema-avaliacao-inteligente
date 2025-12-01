'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Paper,
  IconButton,
} from '@mui/material';
import { ArrowBack, Visibility, Description } from '@mui/icons-material';

export default function CursoAlunoPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = params?.cursoId || params?.id || params?.cursoId?.toString?.();

  const [curso, setCurso] = useState(null);
  const [loadingCurso, setLoadingCurso] = useState(true);
  const [error, setError] = useState(null);

  const [provas, setProvas] = useState([]);
  const [loadingProvas, setLoadingProvas] = useState(true);

  const [listas, setListas] = useState([]);
  const [loadingListas, setLoadingListas] = useState(true);

  const [listasFinalizadas, setListasFinalizadas] = useState({}); 

  // Usando dados mockados
  useEffect(() => {
    if (!cursoId) return;

    const mockedCurso = {
      id: cursoId,
      nome: 'Lógica de Programação',
      codigo: 'LP101',
      descricao: 'Curso introdutório com conceitos básicos de programação e algoritmos.',
    };

    const mockedProvas = [
      { id: 'p1', titulo: 'Prova 1', instrucoes: 'Tempo: 60min', finalizada: true, nota: 7.5 },
    ];

    const mockedListas = [
      { id: 'l1', tituloLista: 'Lista 1', nomeInstituicao: 'Unifesp', nota: 8.5 },
      { id: 'l2', tituloLista: 'Lista 2', nomeInstituicao: 'Unifesp' },
    ];

    const mockedStatus = {
      l1: true,
      l2: true,
      l3: false,
    };

    // Simular delay de carregamento
    setLoadingCurso(true);
    setLoadingProvas(true);
    setLoadingListas(true);
    setError(null);

    const t = setTimeout(() => {
      setCurso(mockedCurso);
      setProvas(mockedProvas);
      setListas(mockedListas);
      setListasFinalizadas(mockedStatus);

      setLoadingCurso(false);
      setLoadingProvas(false);
      setLoadingListas(false);
    }, 300); 

    return () => clearTimeout(t);
  }, [cursoId]);

  if (loadingCurso) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando curso (mock)...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '60vh', p: 3, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button variant="contained" onClick={() => router.push('/aluno/cursos')}>Voltar</Button>
      </Box>
    );
  }

  const GradePill = ({ grade }) => {
    if (!Number.isFinite(grade)) return null;
    const graded = true;
    const bg = graded ? '#7c4dff' : 'grey.300';
    const color = 'common.white';
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 88,
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          bgcolor: bg,
          color,
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.9 }}>Nota</Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1 }}>{grade.toFixed(1)}</Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 3, backgroundColor: 'background.default' }}>
      <Button startIcon={<ArrowBack />} onClick={() => router.push('/aluno/cursos')} sx={{ mb: 2 }}>
        Voltar para Cursos
      </Button>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{curso?.nome}</Typography>
            {curso?.codigo && <Chip label={`Código: ${curso.codigo}`} size="small" sx={{ mt: 1 }} />}
            {curso?.descricao && <Typography sx={{ color: 'text.secondary', mt: 1 }}>{curso.descricao}</Typography>}
          </Box>
          <Box>
            <Button variant="contained" onClick={() => { navigator.clipboard?.writeText(curso?.codigo || ''); alert('Código copiado'); }}>
              Copiar Código
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Provas */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Provas ({provas.length})</Typography>
        </Box>

        {loadingProvas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress/></Box>
        ) : provas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary' }}>Nenhuma prova disponível.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {provas.map((prova) => {
              const id = prova.id || prova._id;
              const grade = Number.isFinite(prova.nota) ? prova.nota : null;

              return (
                <Card key={id}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{prova.titulo}</Typography>
                      {prova.instrucoes && <Typography sx={{ color: 'text.secondary' }}>{prova.instrucoes}</Typography>}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <GradePill grade={grade} />
                      <Button
                        variant="contained"
                        onClick={() => router.push(`/aluno/cursos/${cursoId}/provas/${id}/resultado`)}
                        startIcon={<Visibility />}
                      >
                        Visualizar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Listas de Exercícios */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Listas de Exercícios ({listas.length})</Typography>
        </Box>

        {loadingListas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress/></Box>
        ) : listas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary' }}>Nenhuma lista disponível.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {listas.map((lista) => {
              const id = lista.id || lista._id;
              const hasGrade = Number.isFinite(lista.nota);
              const grade = Number.isFinite(lista.nota) ? lista.nota : null;

              const action = hasGrade
                ? { label: 'Visualizar', href: `/aluno/cursos/${cursoId}/listas/${id}/resultado`, icon: <Visibility /> }
                : { label: 'Responder', href: `/aluno/cursos/${cursoId}/listas/${id}/responder`, icon: null };

              return (
                <Card key={id}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{lista.tituloLista || lista.titulo || 'Lista'}</Typography>
                      {lista.nomeInstituicao && <Typography sx={{ color: 'text.secondary' }}>{lista.nomeInstituicao}</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <GradePill grade={grade} />
                      <Button
                        variant="contained"
                        startIcon={action.icon}
                        onClick={() => router.push(action.href)}
                      >
                        {action.label}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}