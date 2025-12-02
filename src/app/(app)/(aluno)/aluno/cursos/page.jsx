"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassroomCard from '../../../../components/ClassroomCard';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  CircularProgress, 
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Search, Clear, School } from '@mui/icons-material';

export default function CursosAlunoPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState('');

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchCursos() {
      try {
        // Buscar os cursos em que o aluno está matriculado
        const response = await fetch('/api/cursos/aluno');
        if (!response.ok) {
          throw new Error('Erro ao carregar cursos');
        }
        const data = await response.json();
        setCursos(data.itens || []);
      } catch (err) {
        setError(err.message || 'Erro desconhecido');
        setCursos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCursos();
  }, []);

  const handleDelete = (cursoId) => {
    // Remove o curso da lista local
    // A exclusão já foi feita pelo CardOptionsButton
    setCursos((prevCursos) => prevCursos.filter((c) => c.id !== cursoId));
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

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

  // Filtrar cursos baseado na busca
  const cursosFiltrados = cursos.filter((curso) => 
    curso.nome.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <Grid container sx={{ backgroundColor: 'background.default' }}>
      <Grid size={12}>
        <Box sx={{
              padding: 5,
            }}>
          {/* Header com título e botão de criar / adicionar curso */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography gutterBottom variant="h4" component="div">
              Meus Cursos
            </Typography>

            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Add />}
              size="large"
              onClick={handleOpenAddDialog}
            >
              Adicionar Curso 
            </Button>

          </Box>

          {/* Barra de pesquisa */}
          <TextField
            placeholder="Buscar cursos por nome..."
            value={searchQuery}
            onChange={handleSearchChange}
            fullWidth
            sx={{ 
              mb: 3,
              maxWidth: 600,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearSearch}
                    edge="end"
                    size="small"
                    title="Limpar busca"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Estados de loading e erro */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2, color: 'text.secondary' }}>Carregando cursos...</Typography>
            </Box>
          )}
          
          {error && (
            <Typography color="error" sx={{ textAlign: 'center', p: 2 }}>
              {error}
            </Typography>
          )}
          
          {!loading && !error && cursosFiltrados.length === 0 && (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                {debouncedSearchQuery 
                  ? 'Nenhum curso encontrado com os critérios de busca.' 
                  : 'Nenhum curso cadastrado ainda.'}
              </Typography>
              <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAddDialog}>
                Adicionar Curso pelo Código
              </Button>
            </Box>
          )}

          {!loading && !error && cursosFiltrados.length > 0 && (
            <Grid container rowSpacing={4} columnSpacing={4} sx={{ 
                                                              backgroundColor: 'background.paper',
                                                              padding: 3,
                                                              borderRadius: 2
                                                            }}>
              {cursosFiltrados.map((curso) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={curso.id}>
                  <ClassroomCard 
                    imgSrc="/blue_bg.jpg" 
                    imgTitle="Course Background"
                    classroomTitle={curso.nome}
                    teacherName=""
                    cursoId={`${curso.id}`}
                    aluno={true}
                    cursoDescricao={curso.descricao}
                    onDelete={handleDelete}
                    questoesCount={curso.questoesCount}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Grid>

      {/* Dialog para adicionar curso por código */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiPaper-root': {
            width: 'min(500px, 95%)',
            maxWidth: '500px',
            borderRadius: 2,
            p: 2,
          },
        }}
      >
        <DialogTitle>Adicionar Curso por Código</DialogTitle>

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
    </Grid>
  );
}
