'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Paper,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Send, CheckCircle, Save, WarningAmber } from '@mui/icons-material';

export default function ResponderListaPage() {
  const params = useParams();
  const router = useRouter();
  const { id: cursoId, listaId } = params;

  const [lista, setLista] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Armazena as respostas do aluno: { questaoId: resposta }
  const [respostas, setRespostas] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchLista();
  }, [listaId]);

  const fetchLista = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/cursos/${cursoId}/listas/${listaId}`);
      
      if (!res.ok) {
        throw new Error('Erro ao carregar lista de exercícios');
      }

      const data = await res.json();
      setLista(data);
      
      // Buscar respostas já salvas do aluno
      const respostasRes = await fetch(`/api/cursos/${cursoId}/listas/${listaId}/respostas`);
      let respostasSalvas: Record<string, any> = {};
      
      if (respostasRes.ok) {
        const respostasData = await respostasRes.json();
        respostasSalvas = respostasData.respostas || {};
      }
      
      // Inicializar respostas (mesclando com as respostas salvas)
      const initialRespostas: Record<string, any> = {};
      data.questoes?.forEach((q: any) => {
        const respostaSalva = respostasSalvas[q.id];
        
        if (respostaSalva !== undefined) {
          // Usar resposta salva
          initialRespostas[q.id] = respostaSalva;
        } else {
          // Inicializar vazio
          if (q.tipo === 'afirmacoes') {
            initialRespostas[q.id] = Array(q.afirmacoes?.length || 0).fill(null);
          } else {
            initialRespostas[q.id] = '';
          }
        }
      });
      setRespostas(initialRespostas);
      
    } catch (err: any) {
      console.error('Erro ao buscar lista:', err);
      setError(err.message || 'Erro ao carregar lista');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setShowConfirmDialog(false); // Fecha o diálogo

      // Preparar payload com as respostas
      const respostasArray = lista.questoes.map((questao: any) => ({
        questaoId: questao.id,
        resposta: respostas[questao.id],
        pontuacaoMaxima: questao.pontuacao || 0,
      }));

      const res = await fetch(`/api/cursos/${cursoId}/listas/${listaId}/respostas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas: respostasArray, finalizado: true }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao salvar respostas');
      }

      const data = await res.json();
      setSuccess(true);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push(`/cursos/${cursoId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Erro ao enviar respostas:', err);
      setError(err.message || 'Erro ao enviar respostas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Preparar payload com as respostas
      const respostasArray = lista.questoes.map((questao: any) => ({
        questaoId: questao.id,
        resposta: respostas[questao.id],
        pontuacaoMaxima: questao.pontuacao || 0,
      }));

      const res = await fetch(`/api/cursos/${cursoId}/listas/${listaId}/respostas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas: respostasArray, finalizado: false }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao salvar respostas');
      }

      // Mostrar mensagem de sucesso temporária
      const savedMessage = error;
      setError(null);
      setTimeout(() => {
        alert('Respostas salvas com sucesso! Você pode continuar editando.');
      }, 100);
      
    } catch (err: any) {
      console.error('Erro ao salvar respostas:', err);
      setError(err.message || 'Erro ao salvar respostas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespostaChange = (questaoId: string, value: any) => {
    setRespostas(prev => ({
      ...prev,
      [questaoId]: value,
    }));
  };

  const handleAfirmacaoChange = (questaoId: string, index: number, value: boolean) => {
    setRespostas(prev => ({
      ...prev,
      [questaoId]: (prev[questaoId] || []).map((v: any, i: number) => 
        i === index ? value : v
      ),
    }));
  };

  const renderQuestao = (questao: any, index: number) => {
    const resposta = respostas[questao.id];

    return (
      <Card key={questao.id} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Questão {index + 1}
            </Typography>
            {questao.pontuacao > 0 && (
              <Chip 
                label={`${questao.pontuacao} pts`} 
                size="small" 
                color="primary" 
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>

          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {questao.enunciado}
          </Typography>

          {/* Imagens/Recursos da questão */}
          {Array.isArray(questao.imagens) && questao.imagens.length > 0 && (
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {questao.imagens.map((imagem: any, idx: number) => (
                <Box
                  key={imagem.id || idx}
                  component="img"
                  src={imagem.url}
                  alt={imagem.filename || `Imagem ${idx + 1} da questão`}
                  sx={{
                    width: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                    borderRadius: 1,
                    backgroundColor: 'background.default',
                    border: 1,
                    borderColor: 'divider'
                  }}
                />
              ))}
            </Box>
          )}

          {/* Múltipla Escolha */}
          {questao.tipo === 'alternativa' && (
            <RadioGroup
              value={resposta}
              onChange={(e) => handleRespostaChange(questao.id, e.target.value)}
            >
              {questao.alternativas?.map((alt: any) => (
                <FormControlLabel
                  key={alt.letra}
                  value={alt.letra}
                  control={<Radio />}
                  label={`${alt.letra}) ${alt.texto}`}
                />
              ))}
            </RadioGroup>
          )}

          {/* Verdadeiro/Falso */}
          {questao.tipo === 'afirmacoes' && (
            <Box>
              {questao.afirmacoes?.map((afirmacao: any, idx: number) => (
                <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {afirmacao.texto}
                  </Typography>
                  <RadioGroup
                    row
                    value={resposta?.[idx] === true ? 'true' : resposta?.[idx] === false ? 'false' : ''}
                    onChange={(e) => handleAfirmacaoChange(questao.id, idx, e.target.value === 'true')}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="Verdadeiro" />
                    <FormControlLabel value="false" control={<Radio />} label="Falso" />
                  </RadioGroup>
                </Box>
              ))}
            </Box>
          )}

          {/* Proposições (Somatório) */}
          {questao.tipo === 'proposicoes' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Marque as proposições corretas e some seus valores:
              </Typography>
              
              <FormGroup sx={{ mb: 2 }}>
                {questao.proposicoes?.map((prop: any, idx: number) => (
                  <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>({prop.valor})</strong> {prop.texto}
                    </Typography>
                  </Box>
                ))}
              </FormGroup>

              <TextField
                fullWidth
                type="number"
                label="Soma das proposições corretas"
                value={resposta}
                onChange={(e) => handleRespostaChange(questao.id, e.target.value)}
                variant="outlined"
              />
            </Box>
          )}

          {/* Numérica */}
          {questao.tipo === 'numerica' && (
            <TextField
              fullWidth
              type="number"
              label="Sua resposta"
              value={resposta}
              onChange={(e) => handleRespostaChange(questao.id, e.target.value)}
              variant="outlined"
              helperText={questao.margemErro > 0 ? `Margem de erro: ±${questao.margemErro}` : ''}
            />
          )}

          {/* Dissertativa */}
          {questao.tipo === 'dissertativa' && (
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Sua resposta"
              value={resposta}
              onChange={(e) => handleRespostaChange(questao.id, e.target.value)}
              variant="outlined"
              placeholder="Digite sua resposta..."
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !lista) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push(`/cursos/${cursoId}`)}>
          Voltar ao Curso
        </Button>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Respostas Enviadas!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            Suas respostas foram salvas com sucesso. Redirecionando...
          </Typography>
          <CircularProgress size={24} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push(`/cursos/${cursoId}`)}
          sx={{ mb: 2 }}
        >
          Voltar ao Curso
        </Button>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            {lista?.tituloLista || 'Lista de Exercícios'}
          </Typography>
          
          {lista?.nomeInstituicao && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {lista.nomeInstituicao}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`${lista?.questoes?.length || 0} questões`} 
              size="small" 
              variant="outlined" 
            />
            {lista?.usarPontuacao && (
              <Chip 
                label={`Total: ${lista.questoes?.reduce((sum: number, q: any) => sum + (q.pontuacao || 0), 0)} pontos`}
                size="small" 
                color="primary"
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Mensagens de Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Questões */}
      <Box sx={{ mb: 4 }}>
        {lista?.questoes?.map((questao: any, index: number) => 
          renderQuestao(questao, index)
        )}
      </Box>

      {/* Botão de Enviar */}
      <Paper sx={{ p: 3, position: 'sticky', bottom: 0, zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push(`/cursos/${cursoId}`)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="outlined"
            startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={submitting}
            size="large"
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
            onClick={() => setShowConfirmDialog(true)}
            disabled={submitting}
            size="large"
          >
            Enviar Respostas
          </Button>
        </Box>
      </Paper>

      {/* Dialog de Confirmação */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        aria-labelledby="confirm-submit-title"
        aria-describedby="confirm-submit-description"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle
          id="confirm-submit-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <WarningAmber color="warning" />
          Confirmar Envio de Respostas
        </DialogTitle>

        <Divider sx={{ mb: 1 }} />

        <DialogContent>
          <DialogContentText id="confirm-submit-description">
            Atenção! Ao enviar suas respostas, elas serão finalizadas e{' '}
            <strong>não poderão mais ser modificadas</strong>.
            <br />
            <br />
            Tem certeza de que deseja enviar suas respostas agora?
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowConfirmDialog(false)}
            color="inherit"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
          >
            {submitting ? 'Enviando...' : 'Confirmar Envio'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
