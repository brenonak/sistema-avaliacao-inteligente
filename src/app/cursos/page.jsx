"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassroomCard from '../components/ClassroomCard';
import { 
  Box, 
  Typography, 
  Button, 
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

          {/* Grid de cursos usando ClassroomCard similar à página inicial */}
          {!loading && !error && cursos.length > 0 && (
            <Grid container rowSpacing={4} columnSpacing={4} sx={{ 
                                                              backgroundColor: 'background.paper',
                                                              padding: 3,
                                                              borderRadius: 2
                                                            }}>
              {cursos.map((curso) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={curso.id}>
                  <ClassroomCard 
                    imgSrc="/blue_bg.jpg" 
                    imgTitle="Course Background"
                    classroomTitle={curso.nome}
                    teacherName={curso.professor}
                    cursoId={curso.id}
                    onDelete={handleDelete}
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
