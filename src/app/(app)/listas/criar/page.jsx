'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Assignment,
  School,
  Description,
  Info,
  ArrowUpward,
  ArrowDownward,
  Clear as ClearIcon,
} from '@mui/icons-material';

export default function CriarListaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('cursoId');
  const cursoNome = searchParams.get('cursoNome');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Campos do formulário
  const [formData, setFormData] = useState({
    nomeMateria: '',
    questoesIds: [],
    nomeInstituicao: '',

  });

  // Estado para questões do curso
  const [questoes, setQuestoes] = useState([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [selectedQuestoes, setSelectedQuestoes] = useState([]);

  useEffect(() => {
    // Pré-preencher o nome da disciplina com o nome do curso, se disponível
    if (cursoNome) {
      setFormData(prev => ({
        ...prev,
        disciplina: decodeURIComponent(cursoNome),
      }));
    }
  }, [cursoNome]);

  // Buscar questões do curso
  useEffect(() => {
    if (!cursoId) return;
    setLoadingQuestoes(true);

    fetch(`/api/cursos/${cursoId}/questoes`)
      .then(res => res.json())
      .then(data => {
        setQuestoes(data.items || []);
      })
      .catch(() => setError('Erro ao carregar questões do curso.'))
      .finally(() => setLoadingQuestoes(false));
  }, [cursoId]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  // Marcar e desmarcar questões
  const handleToggleQuestao = (id) => {
    setSelectedQuestoes((prev) => {
      if (prev.includes(id)) {
        // Remover questão
        return prev.filter(q => q !== id);
      } else {
        // Adicionar questão no final da lista
        return [...prev, id];
      }
    });
  };

  // Mover questão para cima na ordem
  const handleMoveUp = (index) => {
    if (index === 0) return; // Já é a primeira
    setSelectedQuestoes((prev) => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
  };

  // Mover questão para baixo na ordem
  const handleMoveDown = (index) => {
    if (index === selectedQuestoes.length - 1) return; // Já é a última
    setSelectedQuestoes((prev) => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
  };

  // Remover questão da seleção
  const handleRemoveQuestao = (id) => {
    setSelectedQuestoes((prev) => prev.filter(q => q !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!formData.nomeMateria.trim()) {
      setError('O nome da matéria é obrigatório');
      return;
    }

    if (!formData.nomeInstituicao.trim()) {
      setError('O nome da instituição é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!cursoId) {
        setError('É necessário estar em um curso para criar uma lista');
        setLoading(false);
        return;
      }

      // Envia os IDs reais das questões
      setQuestoes(selectedQuestoes.map(qId => {
        const questao = questoes.find(q => (q._id || q.id) === qId);
        return questao?._id || qId;
      }));

      const saveResponse = await fetch(`/api/cursos/${cursoId}/listas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Erro ao salvar lista');
      }

      setSuccess(true);

      router.push(`/cursos/${cursoId}`);
    } catch (err) {
      console.error('Erro ao criar lista:', err);
      setError(err.message || 'Erro ao criar lista. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    if (cursoId) {
      router.push(`/cursos/${cursoId}`);
    } else {
      router.push('/cursos');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleVoltar}
          sx={{ mb: 2 }}
        >
          Voltar
        </Button>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Assignment sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Criar Nova Lista de Exercícios
              </Typography>
              {cursoNome && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Curso: {decodeURIComponent(cursoNome)}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Mensagens de erro e sucesso */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Lista salva com sucesso! Redirecionando...
        </Alert>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Informações da Lista */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Info sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Informações
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Nome da Matéria"
                    placeholder="Ex: Matemática"
                    value={formData.nomeMateria}
                    onChange={handleChange('nomeMateria')}
                    variant="outlined"
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Cabeçalho da Lista */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <School sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Dados do Cabeçalho
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome da Escola/Instituição"
                    placeholder="Ex: Universidade Federal de São Paulo"
                    value={formData.nomeInstituicao}
                    onChange={handleChange('nomeInstituicao')}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Questões da Lista */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Description sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Questões da Lista
                </Typography>
              </Box>

              {loadingQuestoes ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : questoes.length === 0 ? (
                <Typography color="text.secondary">
                  Nenhuma questão cadastrada neste curso.
                </Typography>
              ) : (
                <Box>
                  {/* Questões Selecionadas - Ordenáveis */}
                  {selectedQuestoes.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Questões Selecionadas ({selectedQuestoes.length})
                        </Typography>
                      </Box>
                      <List sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1 }}>
                        {selectedQuestoes.map((questaoId, index) => {
                          const questao = questoes.find(q => (q._id || q.id) === questaoId);
                          if (!questao) return null;

                          return (
                            <ListItem
                              key={questaoId}
                              sx={{
                                border: 1,
                                borderColor: 'primary.main',
                                borderRadius: 1,
                                mb: 1,
                                bgcolor: 'background.paper',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {/* Número da ordem */}
                              <Box
                                sx={{
                                  minWidth: 40,
                                  height: 40,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                  borderRadius: 1,
                                  fontWeight: 'bold',
                                  fontSize: '1.1rem',
                                }}
                              >
                                {index + 1}
                              </Box>

                              {/* Conteúdo da questão */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {questao.enunciado || 'Sem enunciado'}
                                </Typography>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {questao.tipo && (
                                    <Chip
                                      label={questao.tipo}
                                      size="small"
                                    />
                                  )}
                                  {questao.tags?.slice(0, 3).map((tag) => (
                                    <Chip
                                      key={`sel-tag-${questaoId}-${tag}`}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>

                              {/* Botões de controle */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Button
                                  size="small"
                                  onClick={() => handleMoveUp(index)}
                                  disabled={index === 0}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                  <ArrowUpward fontSize="small" />
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => handleMoveDown(index)}
                                  disabled={index === selectedQuestoes.length - 1}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                  <ArrowDownward fontSize="small" />
                                </Button>
                              </Box>

                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleRemoveQuestao(questaoId)}
                                sx={{ minWidth: 'auto', p: 1 }}
                              >
                                <ClearIcon />
                              </Button>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  )}

                  {/* Divider se houver questões selecionadas */}
                  {selectedQuestoes.length > 0 && (
                    <Divider sx={{ my: 2 }}>
                      <Chip label="Questões Disponíveis" size="small" />
                    </Divider>
                  )}

                  {/* Questões Disponíveis */}
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {questoes
                      .filter(questao => !selectedQuestoes.includes(questao._id || questao.id))
                      .map((questao) => {
                        const questaoId = questao._id || questao.id;

                        return (
                          <ListItem
                            key={questaoId}
                            dense
                            component="div"
                            onClick={() => handleToggleQuestao(questaoId)}
                            sx={{
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              cursor: 'pointer',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 2,
                              flexWrap: 'wrap',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                          >
                            <Checkbox
                              checked={false}
                              tabIndex={-1}
                              disableRipple
                            />

                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {questao.enunciado || 'Sem enunciado'}
                              </Typography>

                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {questao.tipo && (
                                  <Chip
                                    key={`tipo-${questaoId}`}
                                    label={questao.tipo}
                                    size="small"
                                  />
                                )}
                                {questao.tags?.map((tag) => (
                                  <Chip
                                    key={`tag-${questaoId}-${tag}`}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          </ListItem>
                        );
                      })}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleVoltar}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              disabled={loading}
            >
              {loading ? 'Gravando Lista...' : 'Gravar Lista'}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}