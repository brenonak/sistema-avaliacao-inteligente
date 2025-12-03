'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Alert,
  Chip,
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Assessment } from '@mui/icons-material';

export default function VisualizarRespostasPage() {
  const params = useParams();
  const router = useRouter();
  const { id: cursoId, listaId } = params;

  const [lista, setLista] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [correcao, setCorrecao] = useState<Record<string, { isCorrect: boolean; pontuacaoObtida: number | null; pontuacaoMaxima: number }>>({});
  const [finalizado, setFinalizado] = useState(false);
  const [dataFinalizacao, setDataFinalizacao] = useState<Date | null>(null);
  const [pontuacaoTotal, setPontuacaoTotal] = useState(0);
  const [pontuacaoObtidaTotal, setPontuacaoObtidaTotal] = useState(0);

  const fetchLista = useCallback(async () => {
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
      
      if (respostasRes.ok) {
        const respostasData = await respostasRes.json();
        setRespostas(respostasData.respostas || {});
        setCorrecao(respostasData.correcao || {});
        setFinalizado(respostasData.finalizado || false);
        setDataFinalizacao(respostasData.dataFinalizacao ? new Date(respostasData.dataFinalizacao) : null);
        setPontuacaoTotal(respostasData.pontuacaoTotal || 0);
        setPontuacaoObtidaTotal(respostasData.pontuacaoObtidaTotal || 0);
      }
      
    } catch (err: any) {
      console.error('Erro ao buscar lista:', err);
      setError(err.message || 'Erro ao carregar lista');
    } finally {
      setLoading(false);
    }
  }, [cursoId, listaId]);

  useEffect(() => {
    fetchLista();
  }, [fetchLista]);

  const renderQuestao = (questao: any, index: number) => {
    const resposta = respostas[questao.id];
    const correcaoQuestao = correcao[questao.id];
    const isCorrect = correcaoQuestao?.isCorrect;
    const pontuacaoObtida = correcaoQuestao?.pontuacaoObtida;
    const pontuacaoMaxima = correcaoQuestao?.pontuacaoMaxima;

    return (
      <Card 
        key={questao.id} 
        sx={{ 
          mb: 3,
          border: finalizado ? 2 : 0,
          borderColor: isCorrect === true ? 'success.main' : isCorrect === false ? 'error.main' : 'transparent',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Questão {index + 1}
              </Typography>
              {finalizado && isCorrect !== undefined && (
                isCorrect ? (
                  <CheckCircle sx={{ color: 'success.main' }} />
                ) : (
                  <Cancel sx={{ color: 'error.main' }} />
                )
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {questao.pontuacao > 0 && (
                <Chip 
                  label={`${questao.pontuacao} pts`} 
                  size="small" 
                  color="primary" 
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              {finalizado && pontuacaoObtida !== undefined && pontuacaoObtida !== null && (
                <Chip 
                  label={`${pontuacaoObtida} / ${pontuacaoMaxima} pts`} 
                  size="small" 
                  color={isCorrect ? 'success' : 'error'}
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>
          </Box>

          {finalizado && (
            <Alert 
              severity={isCorrect ? 'success' : 'error'} 
              sx={{ mb: 2 }}
            >
              {isCorrect ? 'Resposta correta!' : 'Resposta incorreta'}
            </Alert>
          )}

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
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Sua Resposta:
              </Typography>
              {questao.alternativas?.map((alt: any) => (
                <Box 
                  key={alt.letra} 
                  sx={{ 
                    p: 1.5, 
                    mb: 1, 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 
                      alt.letra === resposta 
                        ? (isCorrect ? 'success.light' : 'error.light')
                        : (finalizado && alt.letra === questao.gabarito && !isCorrect ? 'success.light' : 'transparent'),
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography 
                    component="div"
                    sx={{ 
                      fontWeight: alt.letra === resposta ? 'bold' : 'normal',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontWeight: 'bold', marginRight: 8 }}>{alt.letra})</span> 
                    {alt.texto}
                    {alt.letra === resposta && (
                      <Chip 
                        label="Sua escolha" 
                        size="small" 
                        sx={{ ml: 2, height: 20 }} 
                        color={isCorrect ? 'success' : 'error'} 
                      />
                    )}
                    {finalizado && alt.letra === questao.gabarito && !isCorrect && (
                      <Chip 
                        label="Correta" 
                        size="small" 
                        sx={{ ml: 2, height: 20 }} 
                        color="success" 
                      />
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Verdadeiro/Falso */}
          {questao.tipo === 'afirmacoes' && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Sua Resposta:
              </Typography>
              {questao.afirmacoes?.map((afirmacao: any, idx: number) => (
                <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {afirmacao.texto}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip
                      label={resposta?.[idx] === true ? 'Verdadeiro' : resposta?.[idx] === false ? 'Falso' : 'Não respondido'}
                      size="small"
                      color={
                        finalizado && resposta?.[idx] === afirmacao.correta
                          ? 'success'
                          : finalizado
                          ? 'error'
                          : 'default'
                      }
                      sx={{ fontWeight: 'bold' }}
                    />
                    {finalizado && resposta?.[idx] !== afirmacao.correta && (
                      <Typography variant="body2" color="success.dark" sx={{ fontWeight: 'bold' }}>
                        Correto: {afirmacao.correta ? 'Verdadeiro' : 'Falso'}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Proposições (Somatório) */}
          {questao.tipo === 'proposicoes' && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Proposições:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {questao.proposicoes?.map((prop: any, idx: number) => (
                  <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    <Typography variant="body2">
                      <strong>({prop.valor})</strong> {prop.texto}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Sua Resposta:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {resposta || 'Não respondido'}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Numérica */}
          {questao.tipo === 'numerica' && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Sua Resposta:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {resposta !== undefined && resposta !== '' ? resposta : 'Não respondido'}
                </Typography>
              </Paper>
              {finalizado && questao.gabarito && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Resposta Esperada / Gabarito:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light' }}>
                    <Typography variant="body1" color="success.dark" sx={{ fontWeight: 'bold' }}>
                      {questao.gabarito}
                      {questao.margemErro > 0 && ` (±${questao.margemErro})`}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}

          {/* Dissertativa */}
          {questao.tipo === 'dissertativa' && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Sua Resposta:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {resposta || 'Não respondido'}
                </Typography>
              </Paper>
            </Box>
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {lista?.tituloLista || 'Lista de Exercícios'}
            </Typography>
            {finalizado && (
              <Chip 
                icon={<CheckCircle />}
                label="Finalizado" 
                color="success" 
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>
          
          {lista?.nomeInstituicao && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              <strong>Instituição:</strong> {lista.nomeInstituicao}
            </Typography>
          )}
          
          {lista?.dataPublicacao && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              <strong>Data:</strong> {new Date(lista.dataPublicacao).toLocaleDateString('pt-BR')}
            </Typography>
          )}

          {finalizado && dataFinalizacao && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Respostas finalizadas em {dataFinalizacao.toLocaleString('pt-BR')}
            </Alert>
          )}

          {/* Resumo de Desempenho */}
          {finalizado && pontuacaoTotal > 0 && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Assessment color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Resultado
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Roda de Porcentagem */}
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={pontuacaoTotal > 0 ? Math.round((pontuacaoObtidaTotal / pontuacaoTotal) * 100) : 0}
                    size={120}
                    thickness={5}
                    color={pontuacaoObtidaTotal >= (pontuacaoTotal * 0.6) ? 'success' : 'error'}
                    sx={{ opacity: 0.3 }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={pontuacaoTotal > 0 ? Math.round((pontuacaoObtidaTotal / pontuacaoTotal) * 100) : 0}
                    size={120}
                    thickness={5}
                    color={pontuacaoObtidaTotal >= (pontuacaoTotal * 0.6) ? 'success' : 'error'}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      strokeLinecap: 'round',
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: pontuacaoObtidaTotal >= (pontuacaoTotal * 0.6) ? 'success.main' : 'error.main' }}>
                      {pontuacaoTotal > 0 ? Math.round((pontuacaoObtidaTotal / pontuacaoTotal) * 100) : 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Acertos
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Pontuação Final
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: pontuacaoObtidaTotal >= (pontuacaoTotal * 0.6) ? 'success.main' : 'error.main' }}>
                      {pontuacaoObtidaTotal.toFixed(1)} / {pontuacaoTotal.toFixed(1)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Questões Corretas
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {Object.values(correcao).filter(c => c.isCorrect).length} / {Object.keys(correcao).length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Questões */}
      <Box sx={{ mb: 4 }}>
        {lista?.questoes?.map((questao: any, index: number) => 
          renderQuestao(questao, index)
        )}
      </Box>

      {/* Footer com botão de voltar */}
      <Paper sx={{ p: 3, position: 'sticky', bottom: 0, zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => router.push(`/cursos/${cursoId}`)}
            size="large"
          >
            Voltar ao Curso
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
