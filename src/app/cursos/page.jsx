"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  CircularProgress, 
  IconButton,
  TextField,
  InputAdornment,
  Chip
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

  // Dados de exemplo embutidos
  // --- REMOVER BLOCOS DE MOCK DE CURSO E USAR API DE VERDADE ---

  // Substituir cursosExemplo, e nos useEffects, trocar por requisições fetch reais.

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

  // Atualizar search: filtrar só frontend (opcional, pode melhorar no futuro para query na API)
  useEffect(() => {
    if (!debouncedSearchQuery) return setCursos((prev) => prev);
    setCursos((prev) => prev.filter(curso => curso.nome.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || (curso.descricao||'').toLowerCase().includes(debouncedSearchQuery.toLowerCase())));
  }, [debouncedSearchQuery]);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        p: 3,
        backgroundColor: 'background.default'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1200, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
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
          placeholder="Buscar cursos por nome ou descrição..."
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
      </Box>

      <Box sx={{ width: '100%', maxWidth: 1200 }}>
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
        
        {!loading && !error && cursos.length === 0 && (
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

        <Grid container spacing={3}>
          {cursos.map((curso) => (
            <Grid item xs={12} sm={6} md={4} key={curso.id}>
              <Card
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <School sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {curso.nome}
                    </Typography>
                  </Box>
                  
                  {curso.descricao && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary', 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {curso.descricao}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip 
                      label={`${typeof curso.questoesCount === 'number' ? curso.questoesCount : (curso.questoes?.length || 0)} questões`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    {curso.professor && (
                      <Chip 
                        label={curso.professor} 
                        size="small" 
                        color="default"
                      />
                    )}
                  </Box>

                  {curso.tags && curso.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {curso.tags.slice(0, 3).map((tag, idx) => (
                        <Chip 
                          key={idx} 
                          label={tag} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                      {curso.tags.length > 3 && (
                        <Chip 
                          label={`+${curso.tags.length - 3}`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Link href={`/cursos/${curso.id}`} passHref style={{ textDecoration: 'none', flexGrow: 1 }}>
                    <Button size="small" variant="contained" color="primary" fullWidth>
                      Ver Detalhes
                    </Button>
                  </Link>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(curso.id)}
                    title="Excluir curso"
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
