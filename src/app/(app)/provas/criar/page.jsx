'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
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

function CriarProvaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('cursoId');
  const cursoNome = searchParams.get('cursoNome');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Campos do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    instrucoes: '',
    nomeEscola: '',
    disciplina: '',
    professor: '',
    data: '',
    duracao: '',
    valorTotal: '',
    observacoes: '',
  });

  // Estado para questões do curso
  const [questoes, setQuestoes] = useState([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [selectedQuestoes, setSelectedQuestoes] = useState([]);
  const [questoesPontuacao, setQuestoesPontuacao] = useState({}); // { questaoId: pontos }

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
    // Remover também a pontuação
    setQuestoesPontuacao((prev) => {
      const newPontuacao = { ...prev };
      delete newPontuacao[id];
      return newPontuacao;
    });
  };

  // Atualizar pontuação de uma questão
  const handleChangePontuacao = (questaoId, valor) => {
    const pontos = parseFloat(valor) || 0;
    setQuestoesPontuacao((prev) => ({
      ...prev,
      [questaoId]: pontos,
    }));
  };

  // Calcular total de pontos
  const calcularTotalPontos = () => {
    return selectedQuestoes.reduce((total, qId) => {
      return total + (questoesPontuacao[qId] || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!formData.titulo.trim()) {
      setError('O título da prova é obrigatório');
      return;
    }

    if (!formData.instrucoes.trim()) {
      setError('As instruções são obrigatórias');
      return;      
    }

    if (!formData.nomeEscola.trim()) {
      setError('O nome da instituição é obrigatório');
      return;
    }

    if (!formData.disciplina.trim()) {
      setError('O nome da disciplina é obrigatório');
      return;
    }

    if (!formData.professor.trim()) {
      setError('O nome do Professor é obrigatório');
      return;
    }

    if (!formData.data) { // .trim() não é necessário para o campo 'date'
      setError('A data da prova é obrigatória');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!cursoId) {
        setError('É necessário estar em um curso para criar uma prova');
        setLoading(false);
        return;
      }

      // Envia os IDs reais das questões
      const questoesSelecionadas = selectedQuestoes.map(qId => {
        const questao = questoes.find(q => (q._id || q.id) === qId);
        return questao?._id || qId;
      });

      // Preparar pontuações usando os IDs reais
      const pontuacoes = {};
      selectedQuestoes.forEach(qId => {
        const questao = questoes.find(q => (q._id || q.id) === qId);
        const realId = questao?._id || qId;
        pontuacoes[realId] = questoesPontuacao[qId] || 0;
      });

      const saveResponse = await fetch(`/api/cursos/${cursoId}/provas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          questoesSelecionadas, // Contém os _id reais
          questoesPontuacao: pontuacoes, // Pontuação por questão
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Erro ao salvar prova');
      }

      setSuccess(true);

      router.push(`/cursos/${cursoId}`);
    } catch (err) {
      console.error('Erro ao criar prova:', err);
      setError(err.message || 'Erro ao criar prova. Tente novamente.');
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
                Criar Nova Prova
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
          Prova salva com sucesso! Redirecionando...
        </Alert>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Informações da Prova */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Info sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Informações
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Título da Prova"
                    placeholder="Ex: Prova Bimestral - Matemática"
                    value={formData.titulo}
                    onChange={handleChange('titulo')}
                    variant="outlined"
                    multiline
                    rows={4}
                  />
                </Grid>

                <Grid xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Instruções"
                    placeholder="Ex: Leia atentamente cada questão antes de responder. Use caneta azul ou preta..."
                    value={formData.instrucoes}
                    onChange={handleChange('instrucoes')}
                    variant="outlined"
                    multiline
                    rows={4}
                  />
                </Grid>

                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    placeholder="Ex: Prova sem consulta. Calculadora permitida..."
                    value={formData.observacoes}
                    onChange={handleChange('observacoes')}
                    variant="outlined"
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Cabeçalho da Prova */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <School sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Dados do Cabeçalho
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome da Escola/Instituição"
                    placeholder="Ex: Universidade Federal de São Paulo"
                    value={formData.nomeEscola}
                    onChange={handleChange('nomeEscola')}
                    variant="outlined"
                    required
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Disciplina"
                    placeholder="Ex: Cálculo I"
                    value={formData.disciplina}
                    onChange={handleChange('disciplina')}
                    variant="outlined"
                    required
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome do Professor"
                    placeholder="Ex: Prof. Dr. João Silva"
                    value={formData.professor}
                    onChange={handleChange('professor')}
                    variant="outlined"
                    required
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data"
                    type="date"
                    value={formData.data}
                    onChange={handleChange('data')}
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    required
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duração"
                    placeholder="Ex: 2 horas"
                    value={formData.duracao}
                    onChange={handleChange('duracao')}
                    variant="outlined"
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Valor Total"
                    placeholder="Ex: 10,0 pontos"
                    value={formData.valorTotal}
                    onChange={handleChange('valorTotal')}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Questões da Prova */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Description sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Questões da Prova
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Total de Pontos:
                          </Typography>
                          <Chip
                            label={`${calcularTotalPontos().toFixed(1)} pts`}
                            color={
                              formData.valorTotal && calcularTotalPontos() > parseFloat(formData.valorTotal)
                                ? 'warning'
                                : 'success'
                            }
                            sx={{ fontWeight: 'bold' }}
                          />
                          {formData.valorTotal && calcularTotalPontos() > parseFloat(formData.valorTotal) && (
                            <Chip
                              label={`+${(calcularTotalPontos() - parseFloat(formData.valorTotal)).toFixed(1)} pts extra`}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
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

                              {/* Campo de pontuação */}
                              <TextField
                                type="number"
                                label="Pontos"
                                value={questoesPontuacao[questaoId] || ''}
                                onChange={(e) => handleChangePontuacao(questaoId, e.target.value)}
                                inputProps={{
                                  min: 0,
                                  step: 0.5,
                                  style: { textAlign: 'center' }
                                }}
                                sx={{ width: 80 }}
                                size="small"
                              />

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
                            {loading ? 'Gravando Prova...' : 'Gravar Prova'}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}

export default function CriarProvaPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <CriarProvaContent />
    </Suspense>
  );
}
