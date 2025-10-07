"use client";

import { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  Chip
} from '@mui/material';
import { Delete } from '@mui/icons-material';

export default function EditQuestionModal({ open, onClose, question, onSaveSuccess }) {
  // Estados para os campos do formulário
  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState('alternativa');
  const [alternativas, setAlternativas] = useState([]);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [gabarito, setGabarito] = useState('');
  const [palavrasChave, setPalavrasChave] = useState('');
  const [respostaNumerica, setRespostaNumerica] = useState('');
  const [margemErro, setMargemErro] = useState('');
  const [afirmacoes, setAfirmacoes] = useState([{ texto: '', correta: true }]);
  const [proposicoes, setProposicoes] = useState([{ texto: '', correta: false }]); // Começa com uma proposição

  const indexToLetter = (i) => String.fromCharCode(65 + i);

 // Efeito para preencher o formulário quando uma questão é selecionada
  useEffect(() => {
    if (question) {
      setEnunciado(question.enunciado || '');
      setTipo(question.tipo || 'alternativa');
      setAlternativas(question.alternativas || []);
      setTagsInput(Array.isArray(question.tags) ? question.tags.join(', ') : '');
      setGabarito(question.gabarito || '');
      setPalavrasChave(Array.isArray(question.palavrasChave) ? question.palavrasChave.join(', ') : '');
      setRespostaNumerica(question.respostaCorreta || '');
      setMargemErro(question.margemErro || '');
      setAfirmacoes(question.afirmacoes && question.afirmacoes.length > 0 ? question.afirmacoes : [{ texto: '', correta: true }]);
    }
  }, [question]);

    useEffect(() => {
    // Limpa os campos de tipos específicos sempre que o tipo da questão mudar no modal
    if (open) { // Só executa a limpeza se o modal estiver aberto
      setAlternativas(question.alternativas || []);
      setAfirmacoes(question.afirmacoes || [{ texto: '', correta: true }]);
      setRespostaNumerica(question.respostaCorreta || '');
      setMargemErro(question.margemErro || '');
      setGabarito(question.gabarito || '');
      setPalavrasChave(Array.isArray(question.palavrasChave) ? question.palavrasChave.join(', ') : '');
    }
  }, [tipo, open, question]); // Roda quando o tipo, a visibilidade do modal ou a questão mudam

  const cleanTags = useMemo(() => (
    tagsInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10)
  ), [tagsInput]);

  const handleSave = async () => {
    // Monta o payload para a API de forma condicional
    const payload =
      tipo === 'dissertativa'
        ? {
            // Se for dissertativa, envia gabarito e palavras-chave
            tipo,
            enunciado,
            alternativas: [], // dissertativa não usa alternativas
            gabarito: gabarito,
            palavrasChave: palavrasChave.split(',').map(s => s.trim()),
            tags: cleanTags,
          }
        : tipo === 'numerica'
          ? {
              tipo,
              enunciado,
              respostaCorreta: parseFloat(respostaNumerica || 0),
              margemErro: margemErro ? parseFloat(margemErro) : 0,
              tags: cleanTags,
            }
        : tipo === 'afirmacoes' 
          ? {
              tipo,
              enunciado,
              afirmacoes: afirmacoes,
              tags: cleanTags,
            }
          : tipo === 'proposicoes' 
            ? {
              tipo,
              enunciado,
              proposicoes: proposicoes.map((p, index) => ({
                valor: Math.pow(2, index),
                texto: p.texto,
                correta: p.correta,
              })),
              tags: cleanTags,
              recursos: recursos.map((r) => r.url),
              }
        : {
            tipo, // Padrão: múltipla escolha
            enunciado,
            alternativas: alternativas.map((a, i) => ({
              letra: indexToLetter(i),
              texto: a.texto,
              correta: !!a.correta,
            })),
            tags: cleanTags,
          };

  
    setSaving(true);
    try {
      const res = await fetch(`/api/questoes/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha ao salvar as alterações');
      
      const updatedQuestion = await res.json();
      onSaveSuccess(updatedQuestion); // Avisa a página principal que o salvamento deu certo
      onClose(); // Fecha o modal
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Editar Questão</DialogTitle>
      <DialogContent>
        {/* O formulário aqui dentro é uma cópia quase idêntica do formulário de criação */}
        <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
          <InputLabel id="tipo-label">Tipo de questão</InputLabel>
          <Select
            labelId="tipo-label"
            value={tipo}
            label="Tipo de questão"
            onChange={(e) => setTipo(e.target.value)}
          >
            <MenuItem value="alternativa">Múltipla escolha</MenuItem>
            <MenuItem value="afirmacoes">Múltiplas Afirmações (V/F)</MenuItem>
            <MenuItem value="dissertativa">Dissertativa</MenuItem>
            <MenuItem value="numerica">Resposta Numérica</MenuItem>
            <MenuItem value="proposicoes">Proposições Múltiplas (Somatório)</MenuItem>
          </Select>
        </FormControl>

        <TextField
          id="tags"
          label="Tags (separadas por vírgula)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          fullWidth
          sx={{ mb: 1 }}
        />
        {cleanTags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {cleanTags.map((tag, index) => <Chip key={index} label={tag} />)}
          </Box>
        )}

        <TextField
          id="enunciado"
          label="Enunciado da Questão"
          multiline
          rows={4}
          value={enunciado}
          onChange={(e) => setEnunciado(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />

        {tipo === 'alternativa' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Alternativas:</Typography>
            <RadioGroup
              value={alternativas.findIndex(alt => alt.correta)}
              onChange={(e) => {
                const selectedIndex = parseInt(e.target.value);
                setAlternativas(alternativas.map((a, i) => ({ ...a, correta: i === selectedIndex })));
              }}
            >
              
                {alternativas.map((alt, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormControlLabel value={index} control={<Radio />} label="" sx={{ mr: 1 }} />
                    <TextField
                      value={alt.texto}
                      onChange={(e) => {
                        const novoTexto = e.target.value;
                        setAlternativas(alternativas.map((a, i) => i === index ? { ...a, texto: novoTexto } : a));
                      }}
                      fullWidth variant="outlined" size="small"
                    />
                    <IconButton
                      onClick={() => {
                        if (alternativas.length > 2) {
                          const novas = alternativas.filter((_, i) => i !== index);
                          if (alt.correta && novas.length) novas[0].correta = true;
                          setAlternativas(novas);
                        }
                      }}
                      disabled={alternativas.length <= 2}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
              ))}
            </RadioGroup>


            {/* BOTÃO 'ADICIONAR' APARECE APENAS PARA 'MÚLTIPLA ESCOLHA' */}
            {tipo === 'alternativa' && (
              <Button
                onClick={() => setAlternativas([...alternativas, { texto: '', correta: false }])}
                sx={{ mt: 1 }}
              >
                + Adicionar alternativa
              </Button>
            )}
          </Box>
        )}

        {tipo === 'afirmacoes' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'text.primary' }}>
              Afirmações:
            </Typography>
            {afirmacoes.map((afirmacao, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                
                {/* 1. O NOVO SELETOR V/F (MAIS BONITO E À ESQUERDA) */}
                <ToggleButtonGroup
                  value={afirmacao.correta}
                  exclusive
                  size="small"
                  onChange={(event, novoValor) => {
                    if (novoValor !== null) { // Impede que o botão seja "desselecionado"
                      const novasAfirmacoes = afirmacoes.map((a, i) => 
                        i === index ? { ...a, correta: novoValor } : a
                      );
                      setAfirmacoes(novasAfirmacoes);
                    }
                  }}
                >
                  <ToggleButton value={true} color="success">V</ToggleButton>
                  <ToggleButton value={false} color="error">F</ToggleButton>
                </ToggleButtonGroup>

                {/* 2. CAMPO DE TEXTO PARA A AFIRMAÇÃO */}
                <TextField
                  label={`Afirmação ${index + 1}`}
                  value={afirmacao.texto}
                  onChange={(e) => {
                    const novoTexto = e.target.value;
                    const novasAfirmacoes = afirmacoes.map((a, i) => 
                      i === index ? { ...a, texto: novoTexto } : a
                    );
                    setAfirmacoes(novasAfirmacoes);
                  }}
                  fullWidth
                  variant="outlined"
                  size="small"
                />

                {/* 3. BOTÃO DE REMOVER */}
                <IconButton
                  onClick={() => {
                    const novasAfirmacoes = afirmacoes.filter((_, i) => i !== index);
                    setAfirmacoes(novasAfirmacoes);
                  }}
                  color="error"
                  disabled={afirmacoes.length <= 1}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
            
            {/* BOTÃO DE ADICIONAR */}
            <Button
              variant="outlined"
              onClick={() => setAfirmacoes([...afirmacoes, { texto: '', correta: true }])}
              sx={{ mt: 1 }}
            >
              + Adicionar Afirmação
            </Button>
          </Box>
        )}

        {/* BLOCO PARA RESPOSTA NUMÉRICA */}
        {tipo === 'numerica' && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              id="resposta-numerica"
              label="Resposta Correta"
              type="number"
              value={respostaNumerica}
              onChange={(e) => setRespostaNumerica(e.target.value)}
              variant="outlined"
              fullWidth
              required
            />
            <TextField
              id="margem-erro"
              label="Margem de Erro (Opcional)"
              type="number"
              value={margemErro}
              onChange={(e) => setMargemErro(e.target.value)}
              variant="outlined"
              fullWidth
            />
          </Box>
        )}

        {/* --- NOVO BLOCO PARA PROPOSIÇÕES MÚLTIPLAS --- */}
        {tipo === 'proposicoes' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'text.primary' }}>
              Proposições:
            </Typography>
            {proposicoes.map((prop, index) => {
              const valor = Math.pow(2, index); // Calcula o valor (1, 2, 4, 8...)
              return (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {/* Checkbox para marcar como verdadeira */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={prop.correta}
                        onChange={(e) => {
                          const novasProposicoes = proposicoes.map((p, i) =>
                            i === index ? { ...p, correta: e.target.checked } : p
                          );
                          setProposicoes(novasProposicoes);
                        }}
                      />
                    }
                    label={valor.toString().padStart(2, '0')} // Mostra o valor (01, 02, 04...)
                  />
                  
                  {/* Campo de texto para a afirmação */}
                  <TextField
                    label={`Afirmação ${valor}`}
                    value={prop.texto}
                    onChange={(e) => {
                      const novoTexto = e.target.value;
                      const novasProposicoes = proposicoes.map((p, i) =>
                        i === index ? { ...p, texto: novoTexto } : p
                      );
                      setProposicoes(novasProposicoes);
                    }}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                  
                  {/* Botão de Remover */}
                  <IconButton
                    onClick={() => {
                      const novasProposicoes = proposicoes.filter((_, i) => i !== index);
                      setProposicoes(novasProposicoes);
                    }}
                    color="error"
                    disabled={proposicoes.length <= 1}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              );
            })}
            {/* Botão de Adicionar */}
            <Button
              variant="outlined"
              onClick={() => setProposicoes([...proposicoes, { texto: '', correta: false }])}
              sx={{ mt: 1 }}
            >
              + Adicionar Proposição
            </Button>
          </Box>
        )}

        {/* BLOCO PARA DISSERTATIVA */}
        {tipo === 'dissertativa' && (
          <Box>
            <TextField
              id="gabarito"
              label="Gabarito / Critérios de Avaliação"
              multiline
              rows={4}
              value={gabarito}
              onChange={(e) => setGabarito(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
              helperText="Descreva a resposta ideal ou os critérios para a correção."
            />
            <TextField
              id="palavras-chave"
              label="Palavras-chave Essenciais (separadas por vírgula)"
              value={palavrasChave}
              onChange={(e) => setPalavrasChave(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
              helperText="Importante para a futura pré-correção com IA."
            />
          </Box>
        )}

      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={24} /> : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}