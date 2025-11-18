import * as React from "react";

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


import { useEffect, useState } from "react";


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
  const [respostas, setRespostas] = useState({});
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

  const handleRespostaChange = (questaoId, value) => {
    setRespostas((prev) => ({ ...prev, [questaoId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Respostas enviadas! (mock)");
  };

  return (
    <Box sx={{ p: 4, maxWidth: 700, mx: "auto" }}>
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
        {provaSelecionada.questoes.map((questao, idx) => (
          <Paper key={questao._id || questao.id} sx={{ mb: 3, p: 2 }} elevation={2}>
            <Typography variant="subtitle1" gutterBottom>
              Questão {idx + 1} ({questao.tipo})
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{questao.enunciado}</Typography>
            {(questao.tipo?.toLowerCase() === "multipla escolha" || questao.tipo?.toLowerCase() === "alternativa") && Array.isArray(questao.alternativas) ? (
              <FormControl component="fieldset" required>
                <RadioGroup
                  value={respostas[questao._id || questao.id] || ""}
                  onChange={e => handleRespostaChange(questao._id || questao.id, e.target.value)}
                >
                  {questao.alternativas.map((alt, i) => {
                    // Se alternativa for objeto, usar letra/texto
                    if (typeof alt === 'object' && alt !== null) {
                      return (
                        <FormControlLabel
                          key={i}
                          value={alt.letra}
                          control={<Radio />}
                          label={`${alt.letra}) ${alt.texto}`}
                        />
                      );
                    }
                    // Se for string
                    return (
                      <FormControlLabel
                        key={i}
                        value={alt}
                        control={<Radio />}
                        label={alt}
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>
            ) : (
              <TextField
                label="Resposta do aluno (preenchida pelo professor)"
                multiline
                minRows={3}
                fullWidth
                required
                value={respostas[questao._id || questao.id] || ""}
                onChange={e => handleRespostaChange(questao._id || questao.id, e.target.value)}
              />
            )}
          </Paper>
        ))}
        <Button type="submit" variant="contained" size="large">Enviar Correção</Button>
      </Box>
    </Box>
  );
}
