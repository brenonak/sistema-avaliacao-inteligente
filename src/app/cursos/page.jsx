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
  const cursosExemplo = [
    {
      id: '1',
      nome: 'Engenharia de Software',
      descricao: 'Curso abrangente sobre metodologias, ferramentas e práticas modernas de desenvolvimento de software.',
      professor: 'Prof. Dr. Fabio Fagundes Silveira',
      tags: ['software', 'programação', 'metodologia', 'engenharia'],
      questoes: [
        {
          id: 'q1',
          enunciado: 'Qual das seguintes é uma metodologia ágil de desenvolvimento de software?',
          tipo: 'alternativa',
          tags: ['scrum', 'metodologia'],
          alternativas: [
            { letra: 'A', texto: 'Scrum', correta: true },
            { letra: 'B', texto: 'Waterfall', correta: false },
            { letra: 'C', texto: 'V-Model', correta: false },
            { letra: 'D', texto: 'Spiral', correta: false }
          ]
        },
        {
          id: 'q2',
          enunciado: 'O que significa refatoração de código?',
          tipo: 'dissertativa',
          tags: ['refatoracao', 'qualidade'],
          gabarito: 'Refatoração é o processo de reestruturar código existente sem alterar seu comportamento externo, visando melhorar sua legibilidade, estrutura e design.'
        }
      ],
      createdAt: new Date('2024-10-01')
    },
    {
      id: '2',
      nome: 'Estruturas de Dados',
      descricao: 'Estudo das principais estruturas de dados e algoritmos fundamentais para a ciência da computação.',
      professor: 'Prof. Dr. Ana Maria Santos',
      tags: ['algoritmos', 'estruturas', 'programação', 'complexidade'],
      questoes: [
        {
          id: 'q3',
          enunciado: 'Qual é a complexidade de tempo da operação de busca em uma árvore binária de busca balanceada?',
          tipo: 'alternativa',
          tags: ['complexidade', 'arvore', 'busca'],
          alternativas: [
            { letra: 'A', texto: 'O(n)', correta: false },
            { letra: 'B', texto: 'O(log n)', correta: true },
            { letra: 'C', texto: 'O(n²)', correta: false },
            { letra: 'D', texto: 'O(1)', correta: false }
          ]
        },
        {
          id: 'q4',
          enunciado: 'Uma pilha (stack) segue qual princípio de organização?',
          tipo: 'alternativa',
          tags: ['pilha', 'estruturas'],
          alternativas: [
            { letra: 'A', texto: 'FIFO - First In, First Out', correta: false },
            { letra: 'B', texto: 'LIFO - Last In, First Out', correta: true },
            { letra: 'C', texto: 'Random Access', correta: false },
            { letra: 'D', texto: 'Priority Based', correta: false }
          ]
        },
        {
          id: 'q5',
          enunciado: 'Calcule o resultado da expressão pós-fixa: 5 3 + 2 *',
          tipo: 'numerica',
          tags: ['expressao', 'pilha', 'calculo'],
          respostaCorreta: 16,
          margemErro: 0
        }
      ],
      createdAt: new Date('2024-09-15')
    },
    {
      id: '3',
      nome: 'Banco de Dados',
      descricao: 'Fundamentos de sistemas de gerenciamento de banco de dados, modelagem e linguagem SQL.',
      professor: 'Prof. Dr. Carlos Roberto Lima',
      tags: ['sql', 'modelagem', 'banco', 'dados'],
      questoes: [
        {
          id: 'q6',
          enunciado: 'Analise as seguintes afirmações sobre normalização de banco de dados:',
          tipo: 'afirmacoes',
          tags: ['normalizacao', 'modelagem'],
          afirmacoes: [
            { texto: 'A primeira forma normal elimina grupos repetidos', correta: true },
            { texto: 'A segunda forma normal elimina dependências funcionais parciais', correta: true },
            { texto: 'A terceira forma normal permite dependências transitivas', correta: false },
            { texto: 'BCNF é mais restritiva que a terceira forma normal', correta: true }
          ]
        }
      ],
      createdAt: new Date('2024-10-10')
    },
    {
      id: '4',
      nome: 'Sistemas Operacionais',
      descricao: 'Conceitos fundamentais de sistemas operacionais, processos, threads, gerenciamento de memória e sistemas de arquivos.',
      professor: 'Prof. Dr. Roberto Silva Mendes',
      tags: ['so', 'processos', 'memoria', 'sistemas'],
      questoes: [],
      createdAt: new Date('2024-10-05')
    }
  ];

  useEffect(() => {
    // Simular carregamento
    setLoading(true);
    setTimeout(() => {
      // Filtrar cursos baseado na busca
      const cursosFiltrados = cursosExemplo.filter(curso => {
        if (!debouncedSearchQuery) return true;
        const searchLower = debouncedSearchQuery.toLowerCase();
        return (
          curso.nome.toLowerCase().includes(searchLower) ||
          curso.descricao.toLowerCase().includes(searchLower) ||
          curso.professor.toLowerCase().includes(searchLower) ||
          curso.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
      setCursos(cursosFiltrados);
      setLoading(false);
    }, 500);
  }, [debouncedSearchQuery]);

  const handleDelete = async (cursoId) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;
    
    // Simular exclusão
    alert('Curso excluído com sucesso');
    setCursos((prevCursos) => prevCursos.filter((c) => c.id !== cursoId));
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

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
                      label={`${curso.questoes?.length || 0} questões`} 
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
