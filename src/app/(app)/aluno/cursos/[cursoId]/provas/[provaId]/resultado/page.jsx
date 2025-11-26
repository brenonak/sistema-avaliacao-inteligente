'use client';

import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Comment as CommentIcon,
  Assessment
} from '@mui/icons-material';

export default function ResultadoProvaPage() {
  const params = useParams();
  const router = useRouter();
  const { cursoId, provaId } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    // Simulação de busca de dados
    // Em produção, isso seria: fetch(`/api/aluno/provas/${provaId}/resultado`)
    const fetchResultado = async () => {
      try {
        setLoading(true);
        
        // TODO: Substituir por chamada real à API
        // const response = await fetch(`/api/aluno/provas/${provaId}/resultado`);
        // const data = await response.json();
        
        // Mock de dados para visualização
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          prova: {
            titulo: 'Prova 1 - Lógica de Programação',
            data: '2023-10-15',
            valorTotal: 10.0,
            professor: 'Prof. Silva',
            instrucoes: 'Responda todas as questões com atenção.'
          },
          desempenho: {
            nota: 7.5,
            aprovado: true,
            dataEntrega: '2023-10-15T10:30:00'
          },
          questoes: [
            {
              id: '1',
              numero: 1,
              enunciado: 'O que é um algoritmo?',
              tipo: 'alternativa',
              valor: 2.0,
              notaObtida: 2.0,
              respostaAluno: 'B',
              gabarito: 'B',
              feedback: 'Correto! Algoritmo é uma sequência de passos finitos.',
              alternativas: [
                { letra: 'A', texto: 'Um tipo de hardware.' },
                { letra: 'B', texto: 'Uma sequência de passos para resolver um problema.' },
                { letra: 'C', texto: 'Uma linguagem de programação.' },
                { letra: 'D', texto: 'Um erro de compilação.' }
              ]
            },
            {
              id: '2',
              numero: 2,
              enunciado: 'Explique a diferença entre while e do-while.',
              tipo: 'dissertativa',
              valor: 3.0,
              notaObtida: 2.5,
              respostaAluno: 'O while verifica a condição antes, o do-while verifica depois.',
              feedback: 'Muito bom, mas poderia ter mencionado que o do-while executa pelo menos uma vez.',
            },
            {
              id: '3',
              numero: 3,
              enunciado: 'Qual o valor de X? int x = 10; x++;',
              tipo: 'numerica',
              valor: 2.0,
              notaObtida: 0.0,
              respostaAluno: '10',
              gabarito: '11',
              feedback: 'Atenção ao operador de pós-incremento. O valor final é 11.',
            },
            {
              id: '4',
              numero: 4,
              enunciado: 'Analise as afirmações sobre arrays.',
              tipo: 'afirmacoes',
              valor: 3.0,
              notaObtida: 3.0,
              respostaAluno: [true, false, true],
              gabarito: [true, false, true],
              feedback: 'Excelente análise.',
              afirmacoes: [
                { texto: 'Arrays têm tamanho fixo em C.', correta: true },
                { texto: 'Arrays podem armazenar tipos diferentes na mesma variável em Java.', correta: false },
                { texto: 'O índice inicial é 0.', correta: true }
              ]
            }
          ]
        };

        setResultado(mockData);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar o resultado da prova.');
      } finally {
        setLoading(false);
      }
    };

    if (provaId) {
      fetchResultado();
    }
  }, [provaId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !resultado) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push(`/aluno/cursos/${cursoId}`)}>
          Voltar ao Curso
        </Button>
      </Box>
    );
  }

  if (!resultado) return null;

  return (
    <Box sx={{ minHeight: '100vh', p: 3, backgroundColor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push(`/aluno/cursos/${cursoId}`)}
          sx={{ mb: 2 }}
        >
          Voltar ao Curso
        </Button>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {resultado.prova.titulo}
            </Typography>
            <Chip 
              icon={<CheckCircle />}
              label="Corrigido" 
              color="success" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          {resultado.prova.professor && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              <strong>Professor:</strong> {resultado.prova.professor}
            </Typography>
          )}
          
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            <strong>Data:</strong> {new Date(resultado.prova.data).toLocaleDateString('pt-BR')}
          </Typography>

          {resultado.desempenho.dataEntrega && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Prova realizada em {new Date(resultado.desempenho.dataEntrega).toLocaleString('pt-BR')}
            </Alert>
          )}

          {/* Resumo de Desempenho */}
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
                  value={resultado.prova.valorTotal > 0 ? Math.round((resultado.desempenho.nota / resultado.prova.valorTotal) * 100) : 0}
                  size={120}
                  thickness={5}
                  color={resultado.desempenho.nota >= (resultado.prova.valorTotal * 0.6) ? 'success' : 'error'}
                  sx={{ opacity: 0.3 }}
                />
                <CircularProgress
                  variant="determinate"
                  value={resultado.prova.valorTotal > 0 ? Math.round((resultado.desempenho.nota / resultado.prova.valorTotal) * 100) : 0}
                  size={120}
                  thickness={5}
                  color={resultado.desempenho.nota >= (resultado.prova.valorTotal * 0.6) ? 'success' : 'error'}
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
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: resultado.desempenho.nota >= (resultado.prova.valorTotal * 0.6) ? 'success.main' : 'error.main' }}>
                    {resultado.prova.valorTotal > 0 ? Math.round((resultado.desempenho.nota / resultado.prova.valorTotal) * 100) : 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Acertos
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Nota Final
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: resultado.desempenho.nota >= (resultado.prova.valorTotal * 0.6) ? 'success.main' : 'error.main' }}>
                    {resultado.desempenho.nota.toFixed(1)} / {resultado.prova.valorTotal.toFixed(1)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Questões Corretas
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {resultado.questoes.filter(q => q.notaObtida === q.valor).length} / {resultado.questoes.length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {resultado.prova.instrucoes && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Instruções:
              </Typography>
              <Typography variant="body2">
                {resultado.prova.instrucoes}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Chip 
              label={`${resultado.questoes.length} questões`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`Total: ${resultado.prova.valorTotal} pontos`}
              size="small" 
              color="primary"
            />
          </Box>
        </Paper>
      </Box>

      {/* Mensagens de Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Lista de Questões */}
      <Box sx={{ mb: 4 }}>
        {resultado.questoes.map((questao, index) => (
            <Card 
              key={questao.id} 
              sx={{ 
                mb: 3,
                border: 2,
                borderColor: questao.notaObtida === questao.valor ? 'success.main' : 
                             questao.notaObtida > 0 ? 'warning.main' : 'error.main'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Cabeçalho da Questão */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      Questão {questao.numero}
                    </Typography>
                    {questao.notaObtida === questao.valor ? (
                      <CheckCircle sx={{ color: 'success.main' }} />
                    ) : (
                      <Cancel sx={{ color: 'error.main' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {questao.valor > 0 && (
                      <Chip 
                        label={`${questao.valor} pts`} 
                        size="small" 
                        color="primary" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                    <Chip 
                      label={`${questao.notaObtida} / ${questao.valor} pts`}
                      color={
                        questao.notaObtida === questao.valor ? 'success' : 
                        questao.notaObtida > 0 ? 'warning' : 'error'
                      }
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>

                <Alert 
                  severity={questao.notaObtida === questao.valor ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                >
                  {questao.notaObtida === questao.valor ? 'Resposta correta!' : 'Resposta incorreta'}
                </Alert>

                {/* Enunciado */}
                <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                  {questao.enunciado}
                </Typography>

                {/* Resposta do Aluno */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sua Resposta:
                  </Typography>
                  
                  {questao.tipo === 'alternativa' ? (
                    <Box>
                      {questao.alternativas.map((alt) => (
                        <Box 
                          key={alt.letra} 
                          sx={{ 
                            p: 1.5, 
                            mb: 1, 
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: 
                              alt.letra === questao.respostaAluno 
                                ? (questao.notaObtida > 0 ? 'success.light' : 'error.light')
                                : (alt.letra === questao.gabarito && questao.notaObtida === 0 ? 'success.light' : 'transparent'),
                            border: 1,
                            borderColor: 'divider'
                          }}
                        >
                          <Typography 
                            sx={{ 
                              fontWeight: alt.letra === questao.respostaAluno ? 'bold' : 'normal',
                              width: '100%'
                            }}
                          >
                            <span style={{ fontWeight: 'bold', marginRight: 8 }}>{alt.letra})</span> 
                            {alt.texto}
                            {alt.letra === questao.respostaAluno && (
                              <Chip 
                                label="Sua escolha" 
                                size="small" 
                                sx={{ ml: 2, height: 20 }} 
                                color={questao.notaObtida > 0 ? 'success' : 'error'} 
                              />
                            )}
                            {alt.letra === questao.gabarito && questao.notaObtida === 0 && (
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
                  ) : questao.tipo === 'afirmacoes' ? (
                    <Box>
                      {questao.afirmacoes?.map((afirmacao, idx) => (
                        <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {afirmacao.texto}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Chip
                              label={questao.respostaAluno?.[idx] === true ? 'Verdadeiro' : questao.respostaAluno?.[idx] === false ? 'Falso' : 'Não respondido'}
                              size="small"
                              color={
                                questao.respostaAluno?.[idx] === afirmacao.correta
                                  ? 'success'
                                  : 'error'
                              }
                              sx={{ fontWeight: 'bold' }}
                            />
                            {questao.respostaAluno?.[idx] !== afirmacao.correta && (
                              <Typography variant="body2" color="success.dark" sx={{ fontWeight: 'bold' }}>
                                Correto: {afirmacao.correta ? 'Verdadeiro' : 'Falso'}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: questao.tipo === 'numerica' ? 'monospace' : 'inherit' }}>
                        {Array.isArray(questao.respostaAluno) 
                          ? questao.respostaAluno.map(v => v.toString()).join(', ') 
                          : questao.respostaAluno || 'Não respondido'}
                      </Typography>
                    </Paper>
                  )}
                </Box>

                {/* Gabarito (se não for alternativa, pois já mostramos acima) */}
                {questao.tipo !== 'alternativa' && questao.tipo !== 'afirmacoes' && questao.gabarito && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Resposta Esperada / Gabarito:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light' }}>
                      <Typography variant="body1" color="success.dark" sx={{ fontWeight: 'bold' }}>
                        {Array.isArray(questao.gabarito) 
                          ? questao.gabarito.map(v => v.toString()).join(', ') 
                          : questao.gabarito}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Feedback do Professor */}
                {questao.feedback && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, display: 'flex', gap: 2 }}>
                    <CommentIcon color="info" />
                    <Box>
                      <Typography variant="subtitle2" color="info.dark" fontWeight="bold">
                        Comentário do Professor:
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                        {questao.feedback}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>

      {/* Footer com botão de voltar */}
      <Paper sx={{ p: 3, position: 'sticky', bottom: 0, zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            size="large"
          >
            Voltar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
