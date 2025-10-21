'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Paper
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  ArrowBack, 
  Search, 
  Clear,
  QuestionAnswer,
  School
} from '@mui/icons-material';

export default function CursoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id;
  
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para o diálogo de adicionar questões existentes
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [questoesDisponiveis, setQuestoesDisponiveis] = useState([]);
  const [selectedQuestoes, setSelectedQuestoes] = useState([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dados de exemplo embutidos
  const cursosExemplo = [
    {
      id: '1',
      nome: 'Engenharia de Software',
      descricao: 'Curso abrangente sobre metodologias, ferramentas e práticas modernas de desenvolvimento de software.',
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
      questoes: [],
      createdAt: new Date('2024-10-05')
    }
  ];

  // Questões de exemplo disponíveis para adicionar
  const questoesExemplo = [
    {
      id: 'q7',
      enunciado: 'Qual é o principal objetivo dos padrões de projeto (design patterns)?',
      tipo: 'alternativa',
      tags: ['design-patterns', 'arquitetura'],
      alternativas: [
        { letra: 'A', texto: 'Aumentar a velocidade de execução', correta: false },
        { letra: 'B', texto: 'Reutilizar soluções testadas para problemas recorrentes', correta: true },
        { letra: 'C', texto: 'Reduzir o tamanho do código', correta: false },
        { letra: 'D', texto: 'Eliminar bugs', correta: false }
      ]
    },
    {
      id: 'q8',
      enunciado: 'Explique o conceito de herança em programação orientada a objetos.',
      tipo: 'dissertativa',
      tags: ['oop', 'heranca'],
      gabarito: 'Herança é um mecanismo da POO que permite criar uma nova classe baseada em uma classe existente, herdando seus atributos e métodos.'
    },
    {
      id: 'q9',
      enunciado: 'Quantas comparações são necessárias no pior caso para encontrar um elemento em um array ordenado de 1000 elementos usando busca binária?',
      tipo: 'numerica',
      tags: ['busca-binaria', 'complexidade'],
      respostaCorreta: 10,
      margemErro: 1
    }
  ];

  useEffect(() => {
    fetchCurso();
  }, [cursoId]);

  const fetchCurso = async () => {
    try {
      setLoading(true);
      // Simular busca no banco de dados
      setTimeout(() => {
        const cursoEncontrado = cursosExemplo.find(c => c.id === cursoId);
        if (cursoEncontrado) {
          setCurso(cursoEncontrado);
        } else {
          setError('Curso não encontrado');
        }
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err.message || 'Erro desconhecido');
      setLoading(false);
    }
  };

  const handleOpenAddDialog = async () => {
    setOpenAddDialog(true);
    setLoadingQuestoes(true);
    
    // Simular carregamento de questões
    setTimeout(() => {
      // Filtrar questões que já estão no curso
      const questoesJaAdicionadas = curso.questoes?.map(q => q.id || q) || [];
      const questoesFiltradas = questoesExemplo.filter(
        q => !questoesJaAdicionadas.includes(q.id)
      );
      
      setQuestoesDisponiveis(questoesFiltradas);
      setLoadingQuestoes(false);
    }, 500);
  };

  const handleToggleQuestao = (questaoId) => {
    setSelectedQuestoes((prev) => {
      if (prev.includes(questaoId)) {
        return prev.filter(id => id !== questaoId);
      } else {
        return [...prev, questaoId];
      }
    });
  };

  const handleAddQuestoes = async () => {
    if (selectedQuestoes.length === 0) {
      alert('Selecione pelo menos uma questão');
      return;
    }

    // Simular adição de questões
    const questoesParaAdicionar = questoesExemplo.filter(q => 
      selectedQuestoes.includes(q.id)
    );
    
    setCurso(prevCurso => ({
      ...prevCurso,
      questoes: [...(prevCurso.questoes || []), ...questoesParaAdicionar]
    }));
    
    alert(`${selectedQuestoes.length} questão(ões) adicionada(s) com sucesso!`);
    setOpenAddDialog(false);
    setSelectedQuestoes([]);
  };

  const handleRemoveQuestao = async (questaoId) => {
    if (!confirm('Tem certeza que deseja remover esta questão do curso?')) return;

    // Simular remoção de questão
    setCurso(prevCurso => ({
      ...prevCurso,
      questoes: (prevCurso.questoes || []).filter(q => q.id !== questaoId)
    }));
    
    alert('Questão removida com sucesso!');
  };

  const handleDeleteCurso = async () => {
    if (!confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) return;

    // Simular exclusão do curso
    alert('Curso excluído com sucesso!');
    router.push('/cursos');
  };

  const filteredQuestoes = questoesDisponiveis.filter(q => 
    q.enunciado?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando curso...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <Typography color="error" variant="h5" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => router.push('/cursos')}>
          Voltar para Cursos
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        p: 3,
        backgroundColor: 'background.default'
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => router.push('/cursos')}
          sx={{ mb: 2 }}
        >
          Voltar para Cursos
        </Button>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <School sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {curso.nome}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteCurso}
              >
                Excluir Curso
              </Button>
            </Box>
          </Box>

          {curso.descricao && (
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              {curso.descricao}
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Questões do Curso */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Questões do Curso ({curso.questoes?.length || 0})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Add />}
              onClick={handleOpenAddDialog}
            >
              Adicionar Questões Existentes
            </Button>
            <Link href={`/questoes/criar?cursoId=${cursoId}&cursoNome=${encodeURIComponent(curso.nome)}`} passHref style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
              >
                Criar Nova Questão
              </Button>
            </Link>
          </Box>
        </Box>

        {(!curso.questoes || curso.questoes.length === 0) ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <QuestionAnswer sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              Nenhuma questão adicionada ainda.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Adicione questões existentes ou crie novas questões para este curso.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {curso.questoes.map((questao, index) => (
              <Card key={questao.id || index} sx={{ backgroundColor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {index + 1}. {questao.enunciado}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip 
                          label={questao.tipo === 'alternativa' ? 'Múltipla escolha' : 
                                 questao.tipo === 'afirmacoes' ? 'Verdadeiro ou Falso' : 
                                 questao.tipo === 'proposicoes' ? 'Somatório' : 
                                 questao.tipo === 'dissertativa' ? 'Dissertativa' : 
                                 questao.tipo === 'numerica' ? 'Numérica' : questao.tipo}
                          size="small"
                          color="primary"
                        />
                        {questao.tags && questao.tags.map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>

                      {/* Preview das alternativas/afirmações */}
                      {questao.alternativas && questao.alternativas.length > 0 && (
                        <Box sx={{ pl: 2 }}>
                          {questao.alternativas.slice(0, 2).map((alt, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: 'text.secondary' }}>
                              {alt.letra}) {alt.texto.substring(0, 50)}{alt.texto.length > 50 ? '...' : ''}
                            </Typography>
                          ))}
                          {questao.alternativas.length > 2 && (
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                              +{questao.alternativas.length - 2} alternativas
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    <IconButton
                      color="error"
                      onClick={() => handleRemoveQuestao(questao.id)}
                      title="Remover do curso"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Dialog para adicionar questões existentes */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Adicionar Questões Existentes
        </DialogTitle>
        <DialogContent>
          {/* Barra de busca */}
          <TextField
            placeholder="Buscar questões..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchQuery('')} size="small">
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {loadingQuestoes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredQuestoes.length === 0 ? (
            <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
              {questoesDisponiveis.length === 0 
                ? 'Todas as questões já foram adicionadas ao curso.' 
                : 'Nenhuma questão encontrada com os critérios de busca.'}
            </Typography>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredQuestoes.map((questao) => (
                <ListItem
                  key={questao.id}
                  dense
                  button
                  onClick={() => handleToggleQuestao(questao.id)}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Checkbox
                    checked={selectedQuestoes.includes(questao.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText
                    primary={questao.enunciado}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={questao.tipo} size="small" />
                        {questao.tags?.slice(0, 3).map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {selectedQuestoes.length > 0 && (
            <Typography variant="body2" sx={{ mt: 2, color: 'primary.main' }}>
              {selectedQuestoes.length} questão(ões) selecionada(s)
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAddQuestoes} 
            variant="contained"
            disabled={selectedQuestoes.length === 0}
          >
            Adicionar Selecionadas
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}