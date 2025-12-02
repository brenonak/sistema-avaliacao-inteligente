'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Comment as CommentIcon,
  Assessment,
  Visibility
} from '@mui/icons-material';

export default function ResultadoListaPage() {
  const params = useParams();
  const router = useRouter();
  const { cursoId, listaId } = params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    // fetch real resultado: lista + respostas/correção do aluno
    const fetchResultado = async () => {
      try {
        setLoading(true);
        setError(null);

        const listaRes = await fetch(`/api/cursos/${cursoId}/listas/${listaId}`);
        if (!listaRes.ok) throw new Error('Erro ao carregar a lista');
        const listaData = await listaRes.json();

        const respostasRes = await fetch(`/api/cursos/${cursoId}/listas/${listaId}/respostas`);
        let respostasData = null;
        if (respostasRes.ok) {
          respostasData = await respostasRes.json();
        } else {
          // Se não conseguir carregar as respostas, considerar vazio (não finalizado)
          respostasData = { respostas: {}, correcao: {}, finalizado: false, dataFinalizacao: null, pontuacaoTotal: 0, pontuacaoObtidaTotal: 0 };
        }

        // Normalizar alguns campos e montar o objeto esperado pela UI
        const listaObj = listaData || {};
        const respostasMap = respostasData?.respostas || {};
        const correcaoMap = respostasData?.correcao || {};

        const valorTotalFromLista = Array.isArray(listaObj.questoes)
          ? listaObj.questoes.reduce((s, q) => s + (q.pontuacao || q.valor || 0), 0)
          : 0;

        const resultadoObj = {
          lista: {
            id: listaObj.id || listaObj._id || listaId,
            titulo: listaObj.tituloLista || listaObj.titulo || listaObj.nome || 'Lista de Exercícios',
            criadoEm: listaObj.criadoEm || listaObj.createdAt || new Date().toISOString(),
            valorTotal: respostasData?.pontuacaoTotal ?? valorTotalFromLista,
            professor: listaObj.professor || listaObj.createdBy || listaObj.ownerId || null,
            instrucoes: listaObj.instrucoes || listaObj.descricao || ''
          },
          desempenho: {
            nota: respostasData?.pontuacaoObtidaTotal ?? respostasData?.pontuacaoObtida ?? 0,
            dataEntrega: respostasData?.dataFinalizacao || null,
            finalizado: !!respostasData?.finalizado
          },
          questoes: Array.isArray(listaObj.questoes) ? listaObj.questoes.map((q, idx) => {
            const qId = q.id || q._id || String(q._id || idx);
            const cor = correcaoMap[qId] || {};
            const resp = respostasMap[qId];

            return {
              id: qId,
              numero: q.numero ?? (idx + 1),
              enunciado: q.enunciado || q.pergunta || q.titulo || '',
              tipo: q.tipo || q.tipoQuestao || 'dissertativa',
              valor: q.pontuacao ?? q.valor ?? 0,
              notaObtida: (cor.pontuacaoObtida !== undefined && cor.pontuacaoObtida !== null) ? cor.pontuacaoObtida : (cor.isCorrect ? (cor.pontuacaoMaxima ?? q.pontuacao ?? q.valor ?? 0) : (cor.isCorrect === false ? 0 : 0)),
              respostaAluno: resp,
              feedback: cor.feedback || q.feedback || null,
              gabarito: q.gabarito,
              alternativas: q.alternativas
            };
          }) : []
        };

        setResultado(resultadoObj);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar o resultado da lista.');
      } finally {
        setLoading(false);
      }
    };

    if (listaId && cursoId) fetchResultado();
  }, [listaId, cursoId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !resultado) {
    return (
      <Box sx={{ minHeight: '60vh', backgroundColor: 'background.default', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push(`/aluno/cursos/${cursoId}`)}>Voltar ao Curso</Button>
      </Box>
    );
  }

  if (!resultado) return null;

  const percent = resultado.lista.valorTotal > 0
    ? Math.round((resultado.desempenho.nota / resultado.lista.valorTotal) * 100)
    : 0;

  const success = percent >= 60;

  return (
    <Box sx={{ minHeight: '100vh', p: 3, backgroundColor: 'background.default' }}>
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push(`/aluno/cursos/${cursoId}`)} sx={{ mb: 2 }}>
          Voltar ao Curso
        </Button>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{resultado.lista.titulo}</Typography>
            <Chip icon={<CheckCircle />} label="Corrigida" color="success" />
          </Box>

          {resultado.lista.professor && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              <strong>Professor:</strong> {resultado.lista.professor}
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Criação:</strong> {new Date(resultado.lista.criadoEm).toLocaleDateString('pt-BR')}
          </Typography>

          {resultado.desempenho.dataEntrega && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Lista entregue em {new Date(resultado.desempenho.dataEntrega).toLocaleString('pt-BR')}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={percent}
                size={120}
                thickness={5}
                sx={{ color: success ? 'success.light' : 'error.light', opacity: 0.3 }}
              />
              <CircularProgress
                variant="determinate"
                value={percent}
                size={120}
                thickness={5}
                color={success ? 'success' : 'error'}
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
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
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: success ? 'success.main' : 'error.main' }}>
                  {percent}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Acertos
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Nota</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: success ? 'success.main' : 'error.main' }}>
                  {resultado.desempenho.nota.toFixed(1)} / {resultado.lista.valorTotal.toFixed(1)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Questões corretas</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {resultado.questoes.filter(q => q.notaObtida === q.valor).length} / {resultado.questoes.length}
                </Typography>
              </Box>
            </Box>
          </Box>

          {resultado.lista.instrucoes && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Instruções:</Typography>
              <Typography variant="body2">{resultado.lista.instrucoes}</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Chip label={`${resultado.questoes.length} questões`} size="small" variant="outlined" />
            <Chip label={`Total: ${resultado.lista.valorTotal} pts`} size="small" color="primary" />
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        {resultado.questoes.map((q) => (
          <Card key={q.id} sx={{ mb: 3, border: 1, borderColor: q.notaObtida === q.valor ? 'success.main' : q.notaObtida > 0 ? 'warning.main' : 'error.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Questão {q.numero}</Typography>
                  <Typography variant="body2" color="text.secondary">{q.enunciado}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label={`${q.notaObtida.toFixed(1)} / ${q.valor.toFixed(1)} pts`} color={q.notaObtida === q.valor ? 'success' : q.notaObtida > 0 ? 'warning' : 'error'} />
                  {q.notaObtida === q.valor ? <CheckCircle color="success" /> : <Cancel color="error" />}
                </Box>
              </Box>

              <Alert severity={q.notaObtida === q.valor ? 'success' : q.notaObtida > 0 ? 'warning' : 'error'} sx={{ mb: 2 }}>
                {q.notaObtida === q.valor ? 'Resposta correta' : q.notaObtida > 0 ? 'Parcialmente correta' : 'Resposta incorreta'}
              </Alert>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Sua Resposta:</Typography>
                {q.tipo === 'alternativa' ? (
                  <Box>
                    {q.alternativas?.map((alt) => (
                      <Box key={alt.letra} sx={{ p: 1.25, mb: 1, borderRadius: 1, border: 1, borderColor: 'divider', bgcolor: alt.letra === q.respostaAluno ? (q.notaObtida > 0 ? 'success.light' : 'error.light') : 'transparent' }}>
                        <Typography sx={{ fontWeight: alt.letra === q.respostaAluno ? 'bold' : 'normal' }}>
                          <strong>{alt.letra})</strong> {alt.texto}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: q.tipo === 'numerica' ? 'monospace' : 'inherit' }}>
                      {Array.isArray(q.respostaAluno) ? q.respostaAluno.join(', ') : q.respostaAluno || 'Não respondido'}
                    </Typography>
                  </Paper>
                )}
              </Box>

              {q.feedback && (
                <Alert severity="info" icon={<CommentIcon />} sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Comentário do Professor:</Typography>
                  <Typography variant="body2">{q.feedback}</Typography>
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <IconButton onClick={() => router.push(`/aluno/cursos/${cursoId}/listas/${resultado.lista.id}/visualizar`)}>
                  <Visibility />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Paper sx={{ p: 3, position: 'sticky', bottom: 0, zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" startIcon={<ArrowBack />} onClick={() => router.push(`/aluno/cursos/${cursoId}`)} size="large">Voltar</Button>
        </Box>
      </Paper>
    </Box>
  );
}
