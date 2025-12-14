'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Stack,
  Avatar,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Snackbar,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  CheckCircle,
  NavigateNext,
  NavigateBefore,
  Comment,
} from '@mui/icons-material';
import Link from 'next/link';



export default function CorrecaoAlunoPage() {
  const params = useParams();
  const router = useRouter();
  const provaId = params?.id;
  const alunoId = params?.alunoId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [prova, setProva] = useState(null);
  const [aluno, setAluno] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [notaTotal, setNotaTotal] = useState(0);
  const [comentarios, setComentarios] = useState({});
  const [notas, setNotas] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!provaId || !alunoId) return;

    const fetchSubmissao = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/provas/${provaId}/submissoes/${alunoId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar submissão');
        }

        const data = await response.json();
        setAluno(data.aluno);
        setProva(data.prova);
        setQuestoes(data.questoes);
        setNotaTotal(data.submissao.notaTotal);

        // Inicializar comentários e notas com valores existentes
        const initialComentarios = {};
        const initialNotas = {};
        data.questoes.forEach((q) => {
          initialComentarios[q.id] = q.feedback || '';
          initialNotas[q.id] = q.pontuacaoObtida?.toString() || '';
        });
        setComentarios(initialComentarios);
        setNotas(initialNotas);
      } catch (err) {
        console.error('Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissao();
  }, [provaId, alunoId]);

  const handleRespostaChange = (questaoId, value) => {
    // Não é mais necessário atualizar respostas, já que vem do servidor
  };

  const handleAfirmacaoChange = (questaoId, index, value) => {
    // Resposta já está preenchida, apenas visualização
  };

  const handleNotaChange = (questaoId, value, maxPontuacao) => {
    let nota = parseFloat(value) || 0;
    if (nota > maxPontuacao) nota = maxPontuacao;
    if (nota < 0) nota = 0;
    setNotas((prev) => ({ ...prev, [questaoId]: nota.toString() }));

    // Recalcular nota total
    const notasAtualizadas = { ...notas, [questaoId]: nota };
    const total = Object.values(notasAtualizadas).reduce(
      (acc, n) => acc + (parseFloat(n) || 0),
      0
    );
    setNotaTotal(total);
  };

  const handleComentarioChange = (questaoId, value) => {
    setComentarios((prev) => ({ ...prev, [questaoId]: value }));
  };

  const calcularNotaTotal = () => {
    return Object.values(notas).reduce((acc, nota) => acc + (parseFloat(nota) || 0), 0);
  };

  const calcularPontuacaoMaxima = () => {
    return questoes.reduce((acc, q) => acc + (q.pontuacao || 0), 0);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Preparar atualizações
      const atualizacoes = questoes.map((questao) => ({
        questaoId: questao.id,
        pontuacaoObtida: parseFloat(notas[questao.id]) || 0,
        feedback: comentarios[questao.id] || null,
      }));

      const response = await fetch(
        `/api/provas/${provaId}/submissoes/${alunoId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ atualizacoes }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar correção');
      }

      setSaving(false);
      setShowSuccess(true);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao salvar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    // Voltar para lista após salvar
    setTimeout(() => {
      router.push(`/provas/${provaId}/submissoes`);
    }, 1500);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <Typography color="error" variant="h6">
          Erro: {error}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  if (!aluno || !prova || questoes.length === 0) {
    return (
      <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <Typography>Dados não encontrados</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href={`/provas/${provaId}/submissoes`}
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          Voltar para Lista
        </Button>

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Correção de Prova
        </Typography>

        <Typography variant="subtitle1" color="text.secondary">
          {prova?.titulo} • {prova?.disciplina}
        </Typography>
      </Box>

      {/* Card do Aluno */}
      <Card sx={{ mb: 4, borderLeft: '4px solid #2196f3' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <Person fontSize="large" />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {aluno?.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {aluno?.email}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="overline" color="text.secondary" display="block">
                Nota Total
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {notaTotal.toFixed(1)} / {calcularPontuacaoMaxima()}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 4 }}>
        Visualize as respostas do aluno e atribua feedback e nota para cada questão.
      </Alert>

      {/* Questões */}
      {questoes.map((questao, idx) => (
        <Paper key={questao.id} sx={{ mb: 3, p: 3 }} elevation={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32, fontSize: 14 }}>
                {idx + 1}
              </Avatar>
              <Chip
                label={questao.tipo.charAt(0).toUpperCase() + questao.tipo.slice(1)}
                size="small"
                variant="outlined"
              />
            </Box>
            <Chip
              label={`${questao.pontuacao} pts`}
              color="primary"
              size="small"
            />
          </Box>

          <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
            {questao.enunciado}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* Múltipla Escolha */}
          {questao.tipo === 'alternativa' && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 1 }}>
                Resposta marcada pelo aluno:
              </FormLabel>
              <RadioGroup value={questao.respostaAluno || ''}>
                {questao.alternativas.map((alt) => (
                  <FormControlLabel
                    key={alt.letra}
                    value={alt.letra}
                    control={<Radio disabled />}
                    label={`${alt.letra}) ${alt.texto}`}
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: questao.respostaAluno === alt.letra ? 'action.selected' : 'transparent',
                    }}
                  />
                ))}
              </RadioGroup>
              {questao.isCorrect && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1 }}>
                  ✓ Resposta correta
                </Typography>
              )}
              {!questao.isCorrect && questao.respostaAluno && (
                <Typography variant="caption" color="error.main" sx={{ mt: 1 }}>
                  ✗ Resposta incorreta
                </Typography>
              )}
            </FormControl>
          )}

          {/* Dissertativa */}
          {questao.tipo === 'dissertativa' && (
            <TextField
              label="Resposta do aluno"
              multiline
              minRows={4}
              fullWidth
              value={questao.respostaAluno || 'Sem resposta'}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2, bgcolor: 'action.hover' }}
            />
          )}

          {/* Numérica */}
          {questao.tipo === 'numerica' && (
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Resposta numérica do aluno"
                fullWidth
                value={questao.respostaAluno !== null && questao.respostaAluno !== undefined ? questao.respostaAluno : 'Sem resposta'}
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: 'action.hover' }}
              />
              {questao.isCorrect && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  ✓ Resposta correta
                </Typography>
              )}
              {!questao.isCorrect && questao.respostaAluno !== null && (
                <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                  ✗ Resposta incorreta
                </Typography>
              )}
            </Box>
          )}

          {/* Afirmações V/F */}
          {questao.tipo === 'afirmacoes' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Respostas marcadas pelo aluno:
              </Typography>
              {questao.afirmacoes.map((afirmacao, i) => {
                const respostaAluno = Array.isArray(questao.respostaAluno) ? questao.respostaAluno[i] : null;
                const isCorrect = respostaAluno === afirmacao.correta;
                return (
                  <Box
                    key={i}
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                      borderLeft: isCorrect ? '3px solid' : 'none',
                      borderColor: isCorrect ? 'success.main' : 'transparent',
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      {afirmacao.texto}
                    </Typography>
                    <RadioGroup row value={respostaAluno?.toString() || ''}>
                      <FormControlLabel
                        value="true"
                        control={<Radio size="small" disabled />}
                        label="Verdadeiro"
                      />
                      <FormControlLabel
                        value="false"
                        control={<Radio size="small" disabled />}
                        label="Falso"
                      />
                    </RadioGroup>
                    {isCorrect && (
                      <Typography variant="caption" color="success.main">
                        ✓ Correto
                      </Typography>
                    )}
                    {!isCorrect && respostaAluno !== null && (
                      <Typography variant="caption" color="error.main">
                        ✗ Incorreto
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Campo de Nota e Comentário */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Atribuir nota para esta questão:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nota"
                  type="number"
                  size="small"
                  value={notas[questao.id] || ''}
                  onChange={(e) => handleNotaChange(questao.id, e.target.value, questao.pontuacao)}
                  inputProps={{
                    min: 0,
                    max: questao.pontuacao,
                    step: 0.5,
                  }}
                  helperText={`Máximo: ${questao.pontuacao} pontos`}
                  sx={{ width: 150 }}
                  color="warning"
                  focused
                />
              </Grid>

              {/* Campo de Comentário/Feedback */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Comment sx={{ color: 'text.secondary', mt: 1 }} />
                  <TextField
                    label="Comentário / Feedback para o aluno"
                    multiline
                    minRows={2}
                    maxRows={4}
                    fullWidth
                    value={comentarios[questao.id] || ''}
                    onChange={(e) => handleComentarioChange(questao.id, e.target.value)}
                    placeholder="Adicione um feedback sobre a resposta do aluno, sugestões de melhoria, erros cometidos..."
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      ))}

      {/* Resumo e Botões */}
      <Paper sx={{ p: 3, mt: 4 }} elevation={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">Nota Final:</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {calcularNotaTotal().toFixed(1)} / {calcularPontuacaoMaxima()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
              >
                Salvar
              </Button>
              <Button
                variant="contained"
                endIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                onClick={handleSaveAndNext}
                disabled={saving}
              >
                Salvar e Voltar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Snackbar de sucesso */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        message="Correção salva com sucesso!"
      />
    </Box>
  );
}
