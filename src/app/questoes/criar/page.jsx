'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  Chip
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import FileItem from '../../components/FileItem';
import { upload } from "@vercel/blob/client";

export default function CriarQuestaoPage() {
  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState('alternativa');
  const [alternativas, setAlternativas] = useState([
    { texto: '', correta: true },
    { texto: '', correta: false },
  ]);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [afirmacoes, setAfirmacoes] = useState([
  { texto: '', correta: true }, // Começa com uma afirmação, marcada como V por padrão
  ]);

  const [respostaNumerica, setRespostaNumerica] = useState('');
  const [margemErro, setMargemErro] = useState('');

  const [proposicoes, setProposicoes] = useState([
    { texto: '', correta: false }, // Começa com uma proposição
  ]);

  const [gabarito, setGabarito] = useState('');
  const [palavrasChave, setPalavrasChave] = useState('');

  const [arquivos, setArquivos] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]); // { name, size, url, type }
  
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

useEffect(() => {
    // Sempre que o tipo mudar, reseta os campos de tipos específicos
    setAlternativas([{ texto: '', correta: true }, { texto: '', correta: false }]);
    setAfirmacoes([{ texto: '', correta: true }]);
    setRespostaNumerica('');
    setMargemErro('');
    setGabarito('');
    setPalavrasChave('');
    setProposicoes([{ texto: '', correta: false }]);
  }, [tipo]);

  const handleClearForm = () => {
    setEnunciado('');
    setTipo('alternativa');
    setAlternativas([
      { texto: '', correta: true },
      { texto: '', correta: false },
    ]);
    setTagsInput('');
    setGabarito('');
    setPalavrasChave('');
    setArquivos([]);
    setUploadedFiles([]);
    setRespostaNumerica('');
    setMargemErro('');
    setAfirmacoes([{ texto: '', correta: true }]);
    setProposicoes([{ texto: '', correta: false }]);
  };

  const indexToLetter = (i) => String.fromCharCode(65 + i); // 0->A, 1->B...

  const handleSubmit = async (event) => {
    event.preventDefault();

    // validações básicas
    if (enunciado.trim() === '') {
      alert('Por favor, preencha o enunciado da questão.');
      return;
    }
    
    // Validações específicas por tipo de questão
    if (tipo === 'alternativa' || tipo === 'vf') {
      if (alternativas.some((a) => a.texto.trim() === '')) {
        alert('Todas as alternativas devem ser preenchidas.');
        return;
      }
      if (!alternativas.some((a) => a.correta)) {
        alert('Marque uma alternativa como correta.');
        return;
      }
    }
    
    // Validação para questão numérica
    if (tipo === 'numerica' && !respostaNumerica) {
      alert('Por favor, informe a resposta correta.');
      return;
    }

    // realiza upload dos arquivos selecionados (se houver)
    let recursos = [];
    if (arquivos.length > 0) {
      try {
        for (const file of arquivos) {
          const uploaded = await uploadSingleFile(file);
          recursos.push(uploaded);
        }
        setUploadedFiles(recursos);
      } catch (e) {
        console.error('Erro ao enviar anexos:', e);
        alert('Falha ao enviar arquivos. Tente novamente.');
        setLoading(false);
        return;
      }
    }

    // monta o payload no formato esperado pela API
    const payload =
      tipo === 'dissertativa'
        ? {
            tipo,
            enunciado,
            alternativas: [], // dissertativa não usa alternativas
            gabarito: gabarito,
            //palavrasChave: palavrasChave.split(',').map(s => s.trim()), // já envia como array -> ARRUMAR DEPOIS
            tags: cleanTags,
            recursos: recursos.map((r) => r.url),
          }
        : tipo === 'numerica'
          ? {
              tipo,
              enunciado,
              respostaCorreta: parseFloat(respostaNumerica || 0), 
              margemErro: margemErro ? parseFloat(margemErro) : 0,
              tags: cleanTags,
              recursos: recursos.map((r) => r.url),
            }
          : tipo === 'afirmacoes'
            ? {
                tipo,
                enunciado,
                afirmacoes: afirmacoes, // Envia o novo array de afirmações
                tags: cleanTags,
                recursos: recursos.map((r) => r.url),
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
            tags:cleanTags,
            recursos: recursos.map((r) => r.url),
          };

    try {
      setLoading(true);
      const res = await fetch('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Falha ao salvar (HTTP ${res.status})`);
      }

      const created = await res.json();
      console.log('Criada:', created);
      alert('Questão salva com sucesso!');

      // limpar formulário completo (inclui arquivos e uploads)
      handleClearForm();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Erro ao salvar questão.');
    } finally {
      setLoading(false);
    }
  };

  // usado pelo botão de upload de arquivo
  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  // upload para Vercel Blob e registro opcional no backend local
  const uploadSingleFile = async (file) => {
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
      clientPayload: JSON.stringify({ originalFilename: file.name, timestamp: Date.now() })
    });

    // Fallback de registro no desenvolvimento local
    try {
      await fetch('/api/resources/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: blob.url,
          key: blob.pathname,
          filename: file.name,
          mime: file.type,
          sizeBytes: file.size
        })
      });
    } catch (_) {
      // silencioso em produção
    }

    return { name: file.name, size: file.size, url: blob.url, type: file.type };
  };

  // manipula seleção de arquivos (sem upload imediato)
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setArquivos((prev) => [...prev, ...files]);
  };

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
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold', color: 'text.primary' }}>
        Criar Nova Questão
      </Typography>

      <Paper 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          width: '100%', 
          maxWidth: 600, 
          p: 4,
          backgroundColor: 'background.paper'
        }}
      >
        {/* Tipo da questão */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="tipo-label">Tipo de questão</InputLabel>
          <Select
            labelId="tipo-label"
            id="tipo"
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

        {/* Campo de Tags */}
        <TextField
          id="tags"
          label="Tags (separadas por vírgula)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          helperText="Adicione até 10 tags separadas por vírgula"
        />
        
        {cleanTags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {cleanTags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                color="primary" 
                variant="outlined" 
                size="small"
              />
            ))}
          </Box>
        )}

        {/* Enunciado */}
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
        

      {/* Alternativas */}
      {tipo === 'alternativa' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'text.primary' }}>
            Alternativas:
          </Typography>
          <RadioGroup
            name="alternativaCorreta"
            value={alternativas.findIndex(alt => alt.correta)}
            onChange={(e) => {
              const selectedIndex = parseInt(e.target.value);
              setAlternativas(alternativas.map((a, i) => ({ ...a, correta: i === selectedIndex })));
            }}
          >
              
              {alternativas.map((alt, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FormControlLabel value={index} control={<Radio />} label="" sx={{ margin: 0, marginRight: 1 }} />
                  <TextField
                    value={alt.texto}
                    onChange={(e) => {
                      const novoTexto = e.target.value;
                      const novas = alternativas.map((a, i) => i === index ? { ...a, texto: novoTexto } : a);
                      setAlternativas(novas);
                    }}
                    placeholder={`Alternativa ${indexToLetter(index)}`}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                  <IconButton
                    onClick={() => {
                      if (alternativas.length > 2) {
                        const novas = alternativas.filter((_, i) => i !== index);
                        if (alt.correta) novas[0].correta = true;
                        setAlternativas(novas);
                      }
                    }}
                    disabled={alternativas.length <= 2}
                    color="error"
                    sx={{ ml: 1 }}
                    title="Remover alternativa"
                  >
                    <Delete />
                  </IconButton>
                </Box>
            ))}
          </RadioGroup>

          {/* BOTÃO 'ADICIONAR' APARECE APENAS PARA 'MÚLTIPLA ESCOLHA' */}
          {tipo === 'alternativa' && (
            <Button
              variant="outlined"
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
          type="number" // Garante que o campo seja numérico
          value={respostaNumerica}
          onChange={(e) => setRespostaNumerica(e.target.value)}
          variant="outlined"
          fullWidth
          required // Indicar que é obrigatório
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

      {/* BLOCO PARA CAMPOS DISSERTATIVOS */}
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

        {/* BOTÃO DE 'ADICIONAR ARQUIVO' */}
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          mb={2}
        >
          Adicionar arquivo
          <VisuallyHiddenInput
            type="file"
            onChange={handleFileChange}
            multiple
          />
        </Button>

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

        {/* Arquivos enviados (links) */}
        {uploadedFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.primary' }}>
              Arquivos enviados:
            </Typography>
            {uploadedFiles.map((f, i) => (
              <Box key={`${f.url}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{f.name}</Typography>
                <a href={f.url} target="_blank" rel="noreferrer">abrir</a>
              </Box>
            ))}
          </Box>
        )}

        {/* Botões */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            color="primary"
          >
            {loading ? 'Salvando...' : 'Salvar Questão'}
          </Button>

          <Button
            type="button"
            variant="outlined"
            onClick={handleClearForm}
            disabled={loading}
            sx={{
              mt: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                borderColor: 'primary.main',
              },
            }}
          >
            Limpar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}