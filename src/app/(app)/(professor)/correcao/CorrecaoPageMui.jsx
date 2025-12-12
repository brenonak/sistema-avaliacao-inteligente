import * as React from "react";
import { useEffect, useState } from "react";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';

import ArrowBack from '@mui/icons-material/ArrowBack';
import School from '@mui/icons-material/School';

// Busca alunos dinamicamente, mas deixa vazio se não houver endpoint
function useAlunos(cursoId) {
  const [alunos, setAlunos] = useState([]);
  useEffect(() => {
    if (!cursoId) return setAlunos([]);
    let cancel = false;
    async function fetchAlunos() {
      try {
        // Tente buscar alunos do curso (ajuste o endpoint se criar no futuro)
        const res = await fetch(`/api/cursos/${cursoId}/alunos`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setAlunos(json.items || json.alunos || []);
      } catch {
        setAlunos([]); // Se não existir endpoint, fica vazio
      }
    }
    fetchAlunos();
    return () => { cancel = true; };
  }, [cursoId]);
  return alunos;
}

export default function CorrecaoPageMui() {
  const [cursos, setCursos] = useState([]);
  const [provasPorCurso, setProvasPorCurso] = useState({});
  const [loading, setLoading] = useState(true);
  const [provaSelecionada, setProvaSelecionada] = useState(null);

  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [corrigidosIds, setCorrigidosIds] = useState(new Set());

  // Estado para as respostas (conteúdo)
  const [respostas, setRespostas] = useState({});
  // Novo estado para notas manuais (apenas para dissertativas)
  const [notasManuais, setNotasManuais] = useState({});
  // Estado para comentários/feedback do professor
  const [comentarios, setComentarios] = useState({});

  // Descobre cursoId da prova selecionada
  const cursoIdDaProva = provaSelecionada?.cursoId || provaSelecionada?.curso_id || provaSelecionada?.curso_id_str || null;
  const alunos = useAlunos(cursoIdDaProva);

  // Buscar cursos e provas
  useEffect(() => {
    async function fetchCursosEProvas() {
      setLoading(true);
      try {
        const resCursos = await fetch("/api/cursos");
        const jsonCursos = await resCursos.json();
        const cursosList = jsonCursos.itens || jsonCursos.itens || jsonCursos.cursos || [];
        setCursos(cursosList);
        // Buscar provas de cada curso
        const provasObj = {};
        for (const curso of cursosList) {
          const resProvas = await fetch(`/api/cursos/${curso.id}/provas`);
          const jsonProvas = await resProvas.json();
          provasObj[curso.id] = jsonProvas.items || jsonProvas.itens || [];
        }
        setProvasPorCurso(provasObj);
      } catch (e) {
        setCursos([]);
        setProvasPorCurso({});
      }
      setLoading(false);
    }
    fetchCursosEProvas();
  }, []);

  // Limpa o form ao mudar de prova
  useEffect(() => {
    setRespostas({});
    setNotasManuais({});
    setComentarios({});
    setAlunoSelecionado("");
    setCorrigidosIds(new Set());
  }, [provaSelecionada]);

  // Busca alunos já corrigidos quando uma prova é selecionada
  useEffect(() => {
    async function fetchCorrigidos() {
      if (!provaSelecionada) return setCorrigidosIds(new Set());
      const provaId = provaSelecionada._id || provaSelecionada.id;
      if (!provaId) return setCorrigidosIds(new Set());
      try {
        const res = await fetch(`/api/cursos/${provaSelecionada.cursoId || provaSelecionada.curso_id}/provas/${provaId}/corrigidos`);
        if (!res.ok) return setCorrigidosIds(new Set());
        const json = await res.json();
        const arr = Array.isArray(json.corrigidos) ? json.corrigidos : [];
        setCorrigidosIds(new Set(arr));
      } catch (e) {
        setCorrigidosIds(new Set());
      }
    }
    fetchCorrigidos();
  }, [provaSelecionada]);

  const handleRespostaChange = (questaoId, value) => {
    setRespostas((prev) => ({ ...prev, [questaoId]: value }));
  };

  // Handler específico para V/F (array de booleanos)
  const handleAfirmacaoChange = (questaoId, index, valueStr) => {
    const value = valueStr === "true";
    setRespostas((prev) => {
      const currentArray = prev[questaoId] ? [...prev[questaoId]] : [];
      currentArray[index] = value;
      return { ...prev, [questaoId]: currentArray };
    });
  };

  // Handler para nota manual (dissertativa)
  const handleNotaChange = (questaoId, value) => {
    setNotasManuais((prev) => ({ ...prev, [questaoId]: value }));
  };

  // Handler para comentário/feedback do professor
  const handleComentarioChange = (questaoId, value) => {
    setComentarios((prev) => ({ ...prev, [questaoId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!alunoSelecionado) {
      alert("Selecione um aluno primeiro.");
      return;
    }

    if (!provaSelecionada || provaSelecionada.questoes.length === 0) {
      alert("Esta prova não tem questões para corrigir.");
      return;
    }

    // Monta o payload
    const payload = {
      alunoId: alunoSelecionado,
      respostas: provaSelecionada.questoes.map(q => {
        const qId = q._id || q.id;
        const tipo = q.tipo?.toLowerCase();

        // Pega a nota manual SOMENTE se for dissertativa
        // Para as outras, envia undefined (o backend calcula automaticamente)
        const notaManual = tipo === 'dissertativa' ? parseFloat(notasManuais[qId] || 0) : undefined;

        return {
          questaoId: qId,
          resposta: respostas[qId],
          pontuacaoObtida: notaManual, // Nota manual é passada AQUI
          pontuacaoMaxima: q.pontuacao || 0,
          feedback: comentarios[qId] // Envia o feedback do professor
        };
      })
    };

    try {
      // Normalização de IDs para garantir que não sejam undefined
      const cursoId = provaSelecionada.cursoId || provaSelecionada.curso_id;
      const provaId = provaSelecionada._id || provaSelecionada.id;

      const response = await fetch(`/api/cursos/${cursoId}/provas/${provaId}/correcao-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Correção salva com sucesso!");
        // Limpa o form e a seleção para permitir corrigir o próximo aluno imediatamente
        setRespostas({});
        setNotasManuais({});
        setAlunoSelecionado("");
      } else {
        console.error("Erro do servidor:", data);
        alert(`Erro ao salvar: ${data.message || 'Erro desconhecido'}`);
      }

    } catch (error) {
      console.error("Erro de rede:", error);
      alert("Erro ao conectar com o servidor.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, backgroundColor: 'background.default' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando cursos e provas...</Typography>
      </Box>
    )
  }

  if (!provaSelecionada) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          p: 3,
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mb: 4 }}>
          <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                color: 'text.primary',
                textAlign: 'center'
              }}
            >
              Correção de Provas
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            {cursos.map((curso) => {
              const provas = provasPorCurso[curso.id] || [];
              return (
                <Card key={curso.id} variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <School color="primary" />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{curso.nome}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Provas</Typography>
                      {provas.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Nenhuma prova para este curso.</Typography>
                      ) : (
                        <List>
                          {provas.map((prova) => (
                            <ListItem key={prova.id || prova._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{prova.titulo}</Typography>
                                {prova.disciplina && <Typography variant="caption" color="text.secondary">{prova.disciplina}</Typography>}
                              </Box>
                              <CardActions sx={{ p: 0 }}>
                                <Button size="small" variant="contained" onClick={() => setProvaSelecionada(prova)}>
                                  Corrigir
                                </Button>
                              </CardActions>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 3,
        backgroundColor: 'background.default'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1000, mb: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 1000, position: 'relative', mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => setProvaSelecionada(null)}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              mb: 2
            }}
          >
            Voltar
          </Button>

          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: 1,
              mt: 4,
              fontWeight: 'bold',
              color: 'text.primary',
              textAlign: 'center'
            }}
          >
            Correção: {provaSelecionada.titulo}
          </Typography>
          {provaSelecionada.professor && (
            <Typography variant="subtitle1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Professor: {provaSelecionada.professor}
            </Typography>
          )}
          {provaSelecionada.disciplina && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
              Disciplina: {provaSelecionada.disciplina}
            </Typography>
          )}
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Divider sx={{ mb: 3 }} />

          <FormControl fullWidth sx={{ mb: 4 }} required>
            <InputLabel id="aluno-label">Escolha o aluno</InputLabel>
            <Select
              labelId="aluno-label"
              value={alunoSelecionado}
              label="Escolha o aluno"
              onChange={e => setAlunoSelecionado(e.target.value)}
            >
              <MenuItem value=""><em>Selecione</em></MenuItem>
              {alunos.length === 0 && (
                <MenuItem value="" disabled>Nenhum aluno encontrado</MenuItem>
              )}
              {alunos.map(aluno => {
                const aid = aluno._id || aluno.id;
                const isCorrigido = aid && corrigidosIds.has(String(aid));
                const label = aluno.nome || aluno.email || aluno.id || aid;

                if (isCorrigido) {
                  return (
                    <Tooltip key={aid} title="Aluno já corrigido" placement="right">
                      <span>
                        <MenuItem value={aid} disabled sx={{ color: 'text.disabled' }}>{label} (Já corrigido)</MenuItem>
                      </span>
                    </Tooltip>
                  );
                }

                return (
                  <MenuItem key={aid} value={aid}>{label}</MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {provaSelecionada.questoes.map((questao, idx) => {
            const qId = questao._id || questao.id;
            const tipo = questao.tipo?.toLowerCase();

            return (
              <Paper key={qId} sx={{ mb: 3, p: 2 }} elevation={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Questão {idx + 1}
                  </Typography>
                  <Chip label={questao.tipo} size="small" />
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>{questao.enunciado}</Typography>


                {/* 1. Múltipla Escolha */}
                {(tipo === "multipla escolha" || tipo === "alternativa") && Array.isArray(questao.alternativas) && (
                  <FormControl component="fieldset" required>
                    <FormLabel component="legend">Resposta do Aluno</FormLabel>
                    <RadioGroup
                      value={respostas[qId] || ""}
                      onChange={e => handleRespostaChange(qId, e.target.value)}
                    >
                      {questao.alternativas.map((alt, i) => {
                        // Se alternativa for objeto, usar letra/texto
                        const label = typeof alt === 'object' ? `${alt.letra}) ${alt.texto}` : alt;
                        const val = typeof alt === 'object' ? alt.letra : alt;

                        return (
                          <FormControlLabel
                            key={i}
                            value={val}
                            control={<Radio />}
                            label={label}
                          />
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                )}

                {/* 2. Afirmações (V/F) */}
                {(tipo === "afirmacoes" || tipo === "verdadeiro ou falso") && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Preencha V ou F para cada item:</Typography>
                    {questao.afirmacoes?.map((afirmacao, i) => (
                      <Box
                        key={i}
                        sx={{
                          mb: 2,
                          p: 2,
                          bgcolor: 'action.hover',
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{afirmacao.texto}</Typography>
                        <RadioGroup
                          row
                          value={respostas[qId]?.[i]?.toString() || ""}
                          onChange={e => handleAfirmacaoChange(qId, i, e.target.value)}
                        >
                          <FormControlLabel value="true" control={<Radio size="small" />} label="Verdadeiro" />
                          <FormControlLabel value="false" control={<Radio size="small" />} label="Falso" />
                        </RadioGroup>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* 3. Numérica */}
                {tipo === "numerica" && (
                  <TextField
                    label="Resposta Numérica"
                    type="number"
                    inputProps={{ step: "any" }}
                    fullWidth
                    required
                    value={respostas[qId] || ""}
                    onChange={e => handleRespostaChange(qId, e.target.value)}
                  />
                )}

                {/* 4. Proposições (Somatório) */}
                {(tipo === "proposicoes" || tipo === "somatorio") && (
                  <Box>
                    {/* Mostrar as proposições para auxílio visual */}
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover' }}>
                      {questao.proposicoes?.map((p, i) => (
                        <Typography key={i} variant="caption" display="block">
                          ({Math.pow(2, i)}) {p.texto}
                        </Typography>
                      ))}
                    </Box>
                    <TextField
                      label="Soma das Proposições (Inteiro)"
                      type="number"
                      inputProps={{ step: "1" }}
                      fullWidth
                      required
                      value={respostas[qId] || ""}
                      onChange={e => handleRespostaChange(qId, e.target.value)}
                    />
                  </Box>
                )}

                {/* 5. Dissertativa */}
                {tipo === "dissertativa" && (
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} md={12}>
                      <TextField
                        label="Resposta do aluno (transcrição)"
                        multiline
                        minRows={5}
                        fullWidth
                        required
                        value={respostas[qId] || ""}
                        onChange={e => handleRespostaChange(qId, e.target.value)}
                        placeholder="Digite aqui a resposta..."
                      />
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Nota"
                        type="number"
                        inputProps={{
                          step: "0.1",
                          min: 0,
                          max: questao.pontuacao || 10
                        }}
                        fullWidth
                        color="warning"
                        focused
                        value={notasManuais[qId] || ""}
                        onChange={e => {
                          let valor = e.target.value;
                          const max = questao.pontuacao || 10;
                          if (parseFloat(valor) > max) valor = max.toString();
                          if (parseFloat(valor) < 0) valor = "0";
                          handleNotaChange(qId, valor);
                        }}
                        helperText={`Máx: ${questao.pontuacao || 10}`}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Fallback para tipos desconhecidos */}
                {!["multipla escolha", "alternativa", "afirmacoes", "verdadeiro ou falso", "numerica", "proposicoes", "somatorio", "dissertativa"].includes(tipo) && (
                  <TextField
                    label="Resposta"
                    multiline
                    fullWidth
                    value={respostas[qId] || ""}
                    onChange={e => handleRespostaChange(qId, e.target.value)}
                  />
                )}

                {/* Campo de Comentário/Feedback do Professor */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    💬 Feedback para o aluno (opcional)
                  </Typography>
                  <TextField
                    label="Comentário do Professor"
                    multiline
                    minRows={2}
                    maxRows={4}
                    fullWidth
                    value={comentarios[qId] || ""}
                    onChange={e => handleComentarioChange(qId, e.target.value)}
                    placeholder="Adicione um feedback sobre a resposta, sugestões de melhoria, erros identificados..."
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  />
                </Box>

              </Paper>
            );
          })}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!alunoSelecionado}
            sx={{ mt: 2 }}
          >
            Enviar Correção
          </Button>
        </Box>
      </Box>
    </Box>
  );
}