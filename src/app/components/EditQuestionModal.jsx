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
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import ImageUploadSection from './ImageUploadSection';
import FileItem from './FileItem';
import AIButton from './AIButton';

export default function EditQuestionModal({ open, onClose, question, onSaveSuccess }) {
  // Estados para os campos do formulário
  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState('alternativa');
  const [alternativas, setAlternativas] = useState([]);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormFilled, setIsFormFilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gabarito, setGabarito] = useState('');
  const [palavrasChave, setPalavrasChave] = useState('');
  const [respostaNumerica, setRespostaNumerica] = useState('');
  const [margemErro, setMargemErro] = useState('');
  const [afirmacoes, setAfirmacoes] = useState([{ texto: '', correta: true }]);
  const [proposicoes, setProposicoes] = useState([{ texto: '', correta: false }]); // Começa com uma proposição
  const [arquivos, setArquivos] = useState([]);
  
  // Estados para funcionalidades de IA
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratingDistractors, setAiGeneratingDistractors] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

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

  // Efeito para verificar se o formulário está preenchido e ativar os botões de IA
  useEffect(() => {
    const isAnyFieldFilled =
      enunciado.trim() !== '' ||
      tagsInput.trim() !== '' ||
      (tipo === 'alternativa' && alternativas.some(a => a.texto.trim() !== '')) ||
      (tipo === 'afirmacoes' && afirmacoes.some(a => a.texto.trim() !== '')) ||
      (tipo === 'numerica' && (respostaNumerica.trim() !== '' || margemErro.trim() !== '')) ||
      (tipo === 'proposicoes' && proposicoes.some(p => p.texto.trim() !== '')) ||
      (tipo === 'dissertativa' && (gabarito.trim() !== '' || palavrasChave.trim() !== ''));

    setIsFormFilled(isAnyFieldFilled);
  }, [enunciado, tagsInput, tipo, alternativas, afirmacoes, respostaNumerica, margemErro, proposicoes, gabarito, palavrasChave]);

  const cleanTags = useMemo(() => (
    tagsInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10)
  ), [tagsInput]);

  const somaProposicoes = useMemo(() => {
  // A função 'reduce' vai passar por cada proposição e acumular a soma
  return proposicoes.reduce((soma, prop, index) => {
    // Se a proposição estiver marcada como correta...
    if (prop.correta) {
      const valor = Math.pow(2, index); // Calcula o valor (1, 2, 4, 8...)
      return soma + valor; // Adiciona o valor à soma
    }
    return soma; // Se não for correta, retorna a soma sem alteração
  }, 0); // O '0' é o valor inicial da soma
}, [proposicoes]); // Recalcula a soma sempre que o array 'proposicoes' mudar

  // Funções de IA
  const handleGenerateEnunciadoWithAI = async () => {
    if (cleanTags.length === 0) {
      setSnackbarMsg('Adicione pelo menos uma tag para gerar um enunciado.');
      return;
    }

    setAiGenerating(true);
    try {
      const payload = {
        tags: cleanTags,
        alternativas: ['alternativa', 'afirmacoes', 'proposicoes'].includes(tipo) 
          ? alternativas.map(a => a.texto).filter(Boolean)
          : [],
        enunciadoInicial: enunciado,
      };

      const res = await fetch("/api/ai/gerar-enunciado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || "A IA não conseguiu gerar um enunciado com os dados fornecidos.");
      }

      const data = await res.json();
      setEnunciado(data.enunciadoGerado);
      setSnackbarMsg('Enunciado gerado com sucesso!');
    } catch (err) {
      console.error("Erro ao gerar enunciado:", err);
      setSnackbarMsg(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleReviewSpellingWithAI = async () => {
    if (!enunciado.trim()) {
      setSnackbarMsg('Por favor, preencha o enunciado da questão.');
      return;
    }

    setAiReviewing(true);
    try {
      const payload = { enunciado };

      if (tipo === 'alternativa') {
        payload.alternativas = alternativas.map(a => a.texto);
      }
      
      if (tipo === 'afirmacoes') {
        payload.afirmacoes = afirmacoes.map(a => a.texto);
      }
      
      if (tipo === 'proposicoes') {
        payload.proposicoes = proposicoes.map(p => p.texto);
      }
      
      if (tipo === 'dissertativa') {
        payload.gabarito = gabarito;
      }

      const res = await fetch("/api/ai/revisar-questao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.enunciadoRevisado) {
        setEnunciado(data.enunciadoRevisado);
      }

      if (tipo === 'alternativa' && data.alternativasRevisadas) {
        setAlternativas(alternativas.map((a, i) => ({
          ...a,
          texto: data.alternativasRevisadas[i] || a.texto,
        })));
      }

      if (tipo === 'afirmacoes' && data.afirmacoesRevisadas) {
        setAfirmacoes(afirmacoes.map((a, i) => ({
          ...a,
          texto: data.afirmacoesRevisadas[i] || a.texto,
        })));
      }

      if (tipo === 'proposicoes' && data.proposicoesRevisadas) {
        setProposicoes(proposicoes.map((p, i) => ({
          ...p,
          texto: data.proposicoesRevisadas[i] || p.texto,
        })));
      }

      if (tipo === 'dissertativa' && data.gabaritoRevisado) {
        setGabarito(data.gabaritoRevisado);
      }

      setSnackbarMsg('Questão revisada com sucesso pela IA!');
    } catch (err) {
      console.error('Erro na revisão:', err);
      setSnackbarMsg(err.message || 'Erro ao revisar questão com IA.');
    } finally {
      setAiReviewing(false);
    }
  };

  const handleGenerateDistractorsWithAI = async () => {
    const alternativaCorreta = alternativas.find(a => a.correta);
    if (!enunciado.trim() || !alternativaCorreta || !alternativaCorreta.texto.trim()) {
      setSnackbarMsg('Para gerar distratores, preencha o enunciado e a alternativa correta.');
      return;
    }

    const quantidadeVazias = alternativas.filter(a => a.texto.trim() === '').length;

    if (quantidadeVazias === 0) {
      setSnackbarMsg('Não há alternativas vazias para preencher com a IA.');
      return;
    }

    setAiGeneratingDistractors(true);
    try {
      const payload = {
        enunciado: enunciado,
        alternativaCorreta: alternativaCorreta.texto,
        tags: cleanTags,
        quantidade: quantidadeVazias
      };

      const res = await fetch("/api/ai/gerar-alternativa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = `Erro HTTP ${res.status}`;
        const resClone = res.clone(); 
        try {
          const errorData = await res.json(); 
          errorMessage = errorData.details || "A IA não conseguiu gerar os distratores.";
        } catch (e) {
          const errorText = await resClone.text(); 
          console.error("A resposta de erro não era JSON. Resposta do servidor:", errorText);
          errorMessage = "Ocorreu um erro inesperado no servidor. Verifique o console.";
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const distratoresGerados = data.alternativasIncorretas;

      if (!distratoresGerados || !Array.isArray(distratoresGerados)) {
        throw new Error("A resposta da IA não continha os dados esperados.");
      }

      let distractorIndex = 0;
      const novasAlternativas = alternativas.map(alt => {
        if (alt.texto.trim() === '' && distractorIndex < distratoresGerados.length) {
          const textoDoDistrator = distratoresGerados[distractorIndex];
          distractorIndex++;
          return { ...alt, texto: textoDoDistrator };
        }
        return alt;
      });
      
      setAlternativas(novasAlternativas);
      setSnackbarMsg('Alternativas vazias preenchidas com sucesso!');
    } catch (err) {
      console.error("Erro ao gerar distratores:", err);
      setSnackbarMsg(err.message);
    } finally {
      setAiGeneratingDistractors(false);
    }
  };

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
            recursos: question.recursos || [],
          }
        : tipo === 'numerica'
          ? {
              tipo,
              enunciado,
              respostaCorreta: parseFloat(respostaNumerica || 0),
              margemErro: margemErro ? parseFloat(margemErro) : 0,
              tags: cleanTags,
              recursos: question.recursos || [],
            }
        : tipo === 'afirmacoes' 
          ? {
              tipo,
              enunciado,
              afirmacoes: afirmacoes,
              tags: cleanTags,
              recursos: question.recursos || [],
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
              recursos: question.recursos || [],
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
            recursos: question.recursos || [],
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

  // manipula seleção de arquivos (sem upload imediato)
  const handleFileChange = (eventOrFiles) => {
    let files = [];

    // Se chamado por evento de input file
    if (eventOrFiles?.target?.files) {
      files = Array.from(eventOrFiles.target.files);
    } else if (Array.isArray(eventOrFiles)) {
      // Se chamado com o banco de imagens frequentes
      files = eventOrFiles;
    }

    if (files.length === 0) return;

    setArquivos((prev) => [...prev, ...files]);
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

        {/* Botões de IA */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <AIButton 
              onClick={handleReviewSpellingWithAI}
              loading={aiReviewing}
              disabled={!isFormFilled || loading}
              variant="outlined"
              label="Revisar"
              tooltipText="Usar IA para revisar ortografia e gramática do que foi preenchido"
            />
            
            <AIButton 
              onClick={handleGenerateEnunciadoWithAI}
              loading={aiGenerating}
              disabled={!isFormFilled || loading}
              variant="outlined"
              label="Gerar Enunciado"
              tooltipText="Usar IA para gerar um enunciado de questão com base nas tags"
            />
  
            {['alternativa', 'afirmacoes', 'proposicoes'].includes(tipo) && (
              <AIButton 
                onClick={handleGenerateDistractorsWithAI}
                loading={aiGeneratingDistractors}
                disabled={!isFormFilled || loading}
                variant="outlined"
                label="Gerar Distratores"
                tooltipText="Gerar alternativas/afirmações incorretas com base no que já foi preenchido"
              />
            )}
          </Box>

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

        {/* PROPOSIÇÕES MÚLTIPLAS */}
        {tipo === 'proposicoes' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'text.primary' }}>
              Proposições:
            </Typography>
            {proposicoes.map((prop, index) => {
              const valor = Math.pow(2, index); // Calcula o valor (1, 2, 4, 8...)
              return (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  
                  {/* 1. SELETOR V/F APRIMORADO À ESQUERDA */}
                  <ToggleButtonGroup
                    value={prop.correta}
                    exclusive
                    size="small"
                    onChange={(event, novoValor) => {
                      if (novoValor !== null) {
                        const novasProposicoes = proposicoes.map((p, i) =>
                          i === index ? { ...p, correta: novoValor } : p
                        );
                        setProposicoes(novasProposicoes);
                      }
                    }}
                  >
                    <ToggleButton value={true} color="success">V</ToggleButton>
                    <ToggleButton value={false} color="error">F</ToggleButton>
                  </ToggleButtonGroup>
                  
                  {/* 2. LABEL COM O VALOR DA PROPOSIÇÃO */}
                  <Typography sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {valor.toString().padStart(2, '0')}
                  </Typography>
                  
                  {/* 3. CAMPO DE TEXTO PARA A AFIRMAÇÃO */}
                  <TextField
                    label={`Afirmação de valor ${valor}`}
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
                  
                  {/* 4. BOTÃO DE REMOVER */}
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

            {/* EXIBIR A SOMA */}
            <Box sx={{ mt: 3, p: 2, border: '1px dashed', borderColor: 'grey.500', borderRadius: 1 }}>
              <Typography variant="h6" component="p" sx={{ color: 'text.primary' }}>
                Resposta Correta (Soma):{' '}
                <Typography component="span" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {somaProposicoes}
                </Typography>
              </Typography>
            </Box>

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

        {/* BOTÕES DE UPLOAD DE ARQUIVO */}
        <ImageUploadSection 
          handleFileChange={handleFileChange}
        />

        {/* Lista de arquivos adicionados */}
        {arquivos.map((file, index) => (
          <FileItem
            key={index}
            file={file}
            onExclude={(f) => {
              setArquivos((prev) => prev.filter((x) => x !== f));
            }}
          />
        ))}

      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={24} /> : 'Salvar Alterações'}
        </Button>
      </DialogActions>

      {/* Snackbar para mensagens de feedback */}
      <Snackbar 
        open={!!snackbarMsg} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarMsg('')} severity="info" sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}