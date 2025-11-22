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

  // Estado para as respostas (conteúdo)
  const [respostas, setRespostas] = useState({});
  // Novo estado para notas manuais (apenas para dissertativas)
  const [notasManuais, setNotasManuais] = useState({});

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
    setAlunoSelecionado("");
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
          pontuacaoMaxima: q.pontuacao || 0
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
    return <Box sx={{ p: 4 }}><Typography>Carregando cursos e provas...</Typography></Box>;
  }

  if (!provaSelecionada) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Correção de Provas</Typography>
        <Typography variant="h6" gutterBottom>Selecione uma prova para corrigir:</Typography>
        {cursos.length === 0 && <Typography color="text.secondary">Nenhum curso encontrado.</Typography>}
        {cursos.map((curso) => (
          <Box key={curso.id} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{curso.nome}</Typography>
            <Box component="ul" sx={{ listStyle: "none", p: 0 }}>
              {(provasPorCurso[curso.id] || []).length === 0 && (
                <Typography color="text.secondary" sx={{ ml: 2 }}>Nenhuma prova para este curso.</Typography>
              )}
              {(provasPorCurso[curso.id] || []).map((prova) => (
                <li key={prova.id || prova._id}>
                  <Paper sx={{ mb: 2, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography variant="subtitle1">{prova.titulo} ({prova.disciplina})</Typography>
                      <Typography variant="body2" color="text.secondary">Professor: {prova.professor}</Typography>
                    </Box>
                    <Button variant="contained" onClick={() => setProvaSelecionada(prova)}>
                      Corrigir
                    </Button>
                  </Paper>
                </li>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: '700', mx: "auto" }}>
      <Button onClick={() => setProvaSelecionada(null)} sx={{ mb: 3 }}>
        ← Voltar
      </Button>
      <Typography variant="h4" gutterBottom>Correção: {provaSelecionada.titulo}</Typography>
      <Typography variant="subtitle1">Professor: {provaSelecionada.professor}</Typography>
      <Typography variant="subtitle2" color="text.secondary">Disciplina: {provaSelecionada.disciplina}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Instruções: {provaSelecionada.instrucoes}</Typography>
      <Divider sx={{ mb: 3 }} />

      <Box component="form" onSubmit={handleSubmit}>
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
            {alunos.map(aluno => (
              <MenuItem key={aluno._id || aluno.id} value={aluno._id || aluno.id}>{aluno.nome || aluno.email || aluno.id}</MenuItem>
            ))}
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

              {/* --- RENDERIZAÇÃO CONDICIONAL POR TIPO --- */}

              {/* 1. Múltipla Escolha */}
              {(tipo === "alternativa") && Array.isArray(questao.alternativas) && (
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
              {(tipo === "afirmacoes") && (
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

              {/* 4. Proposições */}
              {(tipo === "proposicoes") && (
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
                        step: "0.01",
                        min: 0,
                        max: questao.pontuacao || 10
                      }}
                      fullWidth
                      required
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
              {!["alternativa", "afirmacoes", "numerica", "proposicoes", "dissertativa"].includes(tipo) && (
                <TextField
                  label="Resposta"
                  multiline
                  fullWidth
                  value={respostas[qId] || ""}
                  onChange={e => handleRespostaChange(qId, e.target.value)}
                />
              )}

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
  );
}