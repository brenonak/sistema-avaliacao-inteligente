"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassroomCard from '../../components/ClassroomCard';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  CircularProgress, 
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, Search, Clear, School } from '@mui/icons-material';

export default function CursosPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchCursos() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/cursos');
        if (!res.ok) throw new Error('Erro ao carregar cursos');
        const json = await res.json();
        setCursos(json.itens || []);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Erro desconhecido');
        setCursos([]);
        setLoading(false);
      }
    }
    fetchCursos();
  }, []);

  const handleDelete = async (cursoId) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir curso');
      setCursos((prevCursos) => prevCursos.filter((c) => c.id !== cursoId));
      alert('Curso excluído com sucesso');
    } catch (e) {
      alert(e.message || 'Erro ao excluir curso.');
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

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
          {/* Header com título e botão de criar curso */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography gutterBottom variant="h4" component="div">
              Meus Cursos
            </Typography>
            <Link href="/cursos/criar" passHref style={{ textDecoration: 'none' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Add />}
                size="large"
              >
                Criar Novo Curso
              </Button>
            </Link>
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
              <Link href="/cursos/criar" passHref style={{ textDecoration: 'none' }}>
                <Button variant="contained" color="primary" startIcon={<Add />}>
                  Criar Primeiro Curso
                </Button>
              </Link>
            </Box>
          )}

          {/* Grid de cursos usando ClassroomCard similar à página inicial */}
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
                    cursoId={curso.id}
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
    </Grid>
  );
}
