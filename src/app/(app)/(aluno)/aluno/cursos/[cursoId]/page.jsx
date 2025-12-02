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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Visibility, Description, School, LogoutRounded } from '@mui/icons-material';

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
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Buscar dados do curso da API
  useEffect(() => {
    if (!cursoId) return;

    async function fetchCursoData() {
      try {
        setLoadingCurso(true);
        setLoadingProvas(true);
        setLoadingListas(true);
        setError(null);

        const response = await fetch(`/api/cursos/aluno/${cursoId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Curso não encontrado ou você não está matriculado');
          } else {
            setError('Erro ao carregar dados do curso');
          }
          setCurso(null);
          setProvas([]);
          setListas([]);
          return;
        }

        const data = await response.json();

        // Atualizar estado com dados reais
        setCurso(data.curso);
        setProvas(data.provas || []);
        setListas(data.listas || []);

        // Marcar listas finalizadas
        const listasFinalizado = {};
        (data.listas || []).forEach((lista) => {
          listasFinalizado[lista.id] = lista.finalizada || false;
        });
        setListasFinalizadas(listasFinalizado);

        setError(null);
      } catch (err) {
        console.error('Erro ao buscar dados do curso:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar curso');
        setCurso(null);
        setProvas([]);
        setListas([]);
      } finally {
        setLoadingCurso(false);
        setLoadingProvas(false);
        setLoadingListas(false);
      }
    }

    fetchCursoData();
  }, [cursoId]);

  const handleSairCurso = async () => {
    try {
      setLoadingDelete(true);

      const response = await fetch(`/api/cursos/aluno/${cursoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Erro ao sair do curso: ${errorData.error || 'Erro desconhecido'}`);
        return;
      }

      alert('Você saiu do curso com sucesso');
      setOpenDeleteDialog(false);
      router.push('/aluno/cursos');
    } catch (err) {
      console.error('Erro ao sair do curso:', err);
      alert('Erro ao sair do curso');
    } finally {
      setLoadingDelete(false);
    }
  };

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
    if (grade === null || grade === undefined) return null;
    if (!Number.isFinite(grade)) return null;
    const graded = Number.isFinite(grade);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/aluno/cursos')}>
          Voltar para Cursos
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutRounded />}
          onClick={() => setOpenDeleteDialog(true)}
          disabled={loadingDelete}
        >
          Sair do Curso
        </Button>
      </Box>

      {/* Dialog de confirmação */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Sair do Curso</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja sair do curso <strong>{curso?.nome}</strong>?
            Você perderá acesso a todas as provas e listas de exercícios deste curso.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleSairCurso}
            color="error"
            variant="contained"
            disabled={loadingDelete}
          >
            {loadingDelete ? <CircularProgress size={24} /> : 'Sair'}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <School sx={{ fontSize: 80, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{curso?.nome}</Typography>
              {curso?.codigo && <Chip label={`Código: ${curso.codigo}`} size="small" sx={{ mt: 1 }} />}
              {curso?.descricao && <Typography sx={{ color: 'text.secondary', mt: 1 }}>{curso.descricao}</Typography>}
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={() => { navigator.clipboard?.writeText(curso?.codigo || ''); alert('Código copiado para a área de transferência'); }}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Copiar Código
          </Button>
        </Box>
      </Paper>

      {/* Provas */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Provas ({provas.length})</Typography>
        </Box>

        {loadingProvas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : provas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary' }}>Nenhuma prova disponível.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {provas.map((prova) => {
              const id = prova.id;
              // Preferir exibir a pontuação total obtida quando disponível (nota total),
              // caso contrário cair para a nota já calculada (0-10) pela API.
              const grade = (prova.pontuacaoObtida !== undefined && prova.pontuacaoObtida !== null)
                ? prova.pontuacaoObtida
                : prova.nota;

              return (
                <Card key={id}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{prova.titulo}</Typography>
                      {prova.instrucoes && <Typography sx={{ color: 'text.secondary' }}>{prova.instrucoes}</Typography>}
                      {prova.disciplina && <Typography variant="caption" sx={{ color: 'text.secondary' }}>Disciplina: {prova.disciplina}</Typography>}
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
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : listas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary' }}>Nenhuma lista disponível.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {listas.map((lista) => {
              const id = lista.id;
              // Preferir pontuação total obtida quando disponível
              const hasGrade = (lista.pontuacaoObtida !== undefined && lista.pontuacaoObtida !== null) || (lista.nota !== null && Number.isFinite(lista.nota));
              const grade = (lista.pontuacaoObtida !== undefined && lista.pontuacaoObtida !== null) ? lista.pontuacaoObtida : (lista.nota ?? null);

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