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

// Dados mockados do aluno
const mockAluno = {
  id: '2',
  nome: 'Bruno Santos',
  email: 'bruno.santos@email.com',
  status: 'pendente',
};

// Dados mockados da prova com questões
const mockProva = {
  id: '1',
  titulo: 'Prova de Cálculo I',
  disciplina: 'Cálculo I',
  professor: 'Prof. João Silva',
  data: '2025-12-10',
  questoes: [
    {
      id: 'q1',
      tipo: 'alternativa',
      enunciado: 'Qual é a derivada de f(x) = x² + 3x - 5?',
      pontuacao: 2,
      alternativas: [
        { letra: 'A', texto: 'f\'(x) = 2x + 3' },
        { letra: 'B', texto: 'f\'(x) = x + 3' },
        { letra: 'C', texto: 'f\'(x) = 2x - 5' },
        { letra: 'D', texto: 'f\'(x) = x² + 3' },
      ],
      respostaCorreta: 'A',
    },
    {
      id: 'q2',
      tipo: 'dissertativa',
      enunciado: 'Calcule a integral indefinida de f(x) = 3x² + 2x e explique cada passo do processo.',
      pontuacao: 3,
    },
    {
      id: 'q3',
      tipo: 'numerica',
      enunciado: 'Qual é o valor de lim(x→2) (x² - 4)/(x - 2)?',
      pontuacao: 2,
      respostaCorreta: 4,
    },
    {
      id: 'q4',
      tipo: 'afirmacoes',
      enunciado: 'Analise as afirmações sobre derivadas e marque V ou F:',
      pontuacao: 2,
      afirmacoes: [
        { texto: 'A derivada de uma constante é zero.', correta: true },
        { texto: 'A derivada de e^x é e^x.', correta: true },
        { texto: 'A derivada de ln(x) é x.', correta: false },
        { texto: 'A regra do produto afirma que (fg)\' = f\'g\'.', correta: false },
      ],
    },
    {
      id: 'q5',
      tipo: 'dissertativa',
      enunciado: 'Demonstre o Teorema Fundamental do Cálculo e dê um exemplo de aplicação.',
      pontuacao: 3,
    },
  ],
};

export default function CorrecaoAlunoPage() {
  const params = useParams();
  const router = useRouter();
  const provaId = params?.id;
  const alunoId = params?.alunoId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prova, setProva] = useState(null);
  const [aluno, setAluno] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [notas, setNotas] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Simula carregamento de dados
    const timer = setTimeout(() => {
      setProva(mockProva);
      setAluno(mockAluno);
      
      // Inicializa as respostas e notas vazias
      const initialRespostas = {};
      const initialNotas = {};
      const initialComentarios = {};
      mockProva.questoes.forEach((q) => {
        initialRespostas[q.id] = q.tipo === 'afirmacoes' ? [] : '';
        initialNotas[q.id] = '';
        initialComentarios[q.id] = '';
      });
      setRespostas(initialRespostas);
      setNotas(initialNotas);
      setComentarios(initialComentarios);
      
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [provaId, alunoId]);

  const handleRespostaChange = (questaoId, value) => {
    setRespostas((prev) => ({ ...prev, [questaoId]: value }));
  };

  const handleAfirmacaoChange = (questaoId, index, value) => {
    setRespostas((prev) => {
      const currentArray = [...(prev[questaoId] || [])];
      currentArray[index] = value === 'true';
      return { ...prev, [questaoId]: currentArray };
    });
  };

  const handleNotaChange = (questaoId, value, maxPontuacao) => {
    let nota = parseFloat(value) || 0;
    if (nota > maxPontuacao) nota = maxPontuacao;
    if (nota < 0) nota = 0;
    setNotas((prev) => ({ ...prev, [questaoId]: nota.toString() }));
  };

  const handleComentarioChange = (questaoId, value) => {
    setComentarios((prev) => ({ ...prev, [questaoId]: value }));
  };

  const calcularNotaTotal = () => {
    return Object.values(notas).reduce((acc, nota) => acc + (parseFloat(nota) || 0), 0);
  };

  const calcularPontuacaoMaxima = () => {
    return prova?.questoes.reduce((acc, q) => acc + q.pontuacao, 0) || 0;
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simula salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setSaving(false);
    setShowSuccess(true);
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    // Aqui navegaria para o próximo aluno
    router.push(`/provas/${provaId}/submissoes`);
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
                {calcularNotaTotal().toFixed(1)} / {calcularPontuacaoMaxima()}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 4 }}>
        Preencha as respostas do aluno conforme a prova em papel e atribua a nota para cada questão.
      </Alert>

      {/* Questões */}
      {prova?.questoes.map((questao, idx) => (
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
              <RadioGroup
                value={respostas[questao.id] || ''}
                onChange={(e) => handleRespostaChange(questao.id, e.target.value)}
              >
                {questao.alternativas.map((alt) => (
                  <FormControlLabel
                    key={alt.letra}
                    value={alt.letra}
                    control={<Radio />}
                    label={`${alt.letra}) ${alt.texto}`}
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: respostas[questao.id] === alt.letra ? 'action.selected' : 'transparent',
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {/* Dissertativa */}
          {questao.tipo === 'dissertativa' && (
            <TextField
              label="Resposta do aluno (transcrição)"
              multiline
              minRows={4}
              fullWidth
              value={respostas[questao.id] || ''}
              onChange={(e) => handleRespostaChange(questao.id, e.target.value)}
              placeholder="Digite aqui a resposta do aluno conforme a prova em papel..."
              sx={{ mb: 2 }}
            />
          )}

          {/* Numérica */}
          {questao.tipo === 'numerica' && (
            <TextField
              label="Resposta numérica do aluno"
              type="number"
              fullWidth
              value={respostas[questao.id] || ''}
              onChange={(e) => handleRespostaChange(questao.id, e.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          {/* Afirmações V/F */}
          {questao.tipo === 'afirmacoes' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Marque V ou F conforme resposta do aluno:
              </Typography>
              {questao.afirmacoes.map((afirmacao, i) => (
                <Box
                  key={i}
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    {afirmacao.texto}
                  </Typography>
                  <RadioGroup
                    row
                    value={respostas[questao.id]?.[i]?.toString() || ''}
                    onChange={(e) => handleAfirmacaoChange(questao.id, i, e.target.value)}
                  >
                    <FormControlLabel
                      value="true"
                      control={<Radio size="small" />}
                      label="Verdadeiro"
                    />
                    <FormControlLabel
                      value="false"
                      control={<Radio size="small" />}
                      label="Falso"
                    />
                  </RadioGroup>
                </Box>
              ))}
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
