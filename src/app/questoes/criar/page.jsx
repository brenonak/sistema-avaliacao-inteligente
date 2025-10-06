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
  Chip
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import ColorModeButtons from '../../components/ColorModeButtons';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import FileItem from '../../components/FileItem';

export default function CriarQuestaoPage() {
  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState('alternativa');
  const [alternativas, setAlternativas] = useState([
    { texto: '', correta: true },
    { texto: '', correta: false },
  ]);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [respostaNumerica, setRespostaNumerica] = useState('');
  const [margemErro, setMargemErro] = useState('');

  const [gabarito, setGabarito] = useState('');
  const [palavrasChave, setPalavrasChave] = useState('');

  const [arquivos, setArquivos] = useState([]);
  
  const cleanTags = useMemo(() => (
    tagsInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10)
  ), [tagsInput]);

  useEffect(() => {
  if (tipo === 'vf') {
    // Quando o tipo for 'vf', força as alternativas para o padrão Verdadeiro/Falso
    setAlternativas([
      { texto: 'Verdadeiro', correta: true },
      { texto: 'Falso', correta: false },
    ]);
  } else {
    // QUANDO FOR QUALQUER OUTRO TIPO (Múltipla Escolha ou Dissertativa),
    // reseta para o padrão de duas alternativas vazias.
    setAlternativas([
      { texto: '', correta: true },
      { texto: '', correta: false },
    ]);
  }

  // Se o tipo NÃO for 'numérica', limpa os campos numéricos.
  if (tipo !== 'numerica') {
    setRespostaNumerica('');
    setMargemErro('');
  }

  // Se o tipo NÃO for 'dissertativa', limpa os campos dissertativos.
  if (tipo !== 'dissertativa') {
    setGabarito('');
    setPalavrasChave('');
  }
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
    setRespostaNumerica('');
    setMargemErro('');
  };

  const indexToLetter = (i) => String.fromCharCode(65 + i); // 0->A, 1->B...

  const handleSubmit = async (event) => {
    event.preventDefault();

    // validações básicas
    if (enunciado.trim() === '') {
      alert('Por favor, preencha o enunciado da questão.');
      return;
    }
    if (tipo !== 'dissertativa') {
      if (alternativas.some((a) => a.texto.trim() === '')) {
        alert('Todas as alternativas devem ser preenchidas.');
        return;
      }
      if (!alternativas.some((a) => a.correta)) {
        alert('Marque uma alternativa como correta.');
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
            palavrasChave: palavrasChave.split(',').map(s => s.trim()), // já envia como array
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
        : {
            tipo, // "alternativa" ou "vf"
            enunciado,
            alternativas: alternativas.map((a, i) => ({
              letra: indexToLetter(i),
              texto: a.texto,
              correta: !!a.correta,
            })),
            tags:cleanTags,
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

      // limpar formulário
      setEnunciado('');
      setTipo('alternativa');
      setAlternativas([
        { texto: '', correta: true },
        { texto: '', correta: false },
      ]);
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

  // manipula seleção de arquivos
  const handleFileChange = (event) => {
    setArquivos((arquivos) => {
      const updated = [...arquivos, ...Array.from(event.target.files)];
      console.log(updated);
      return updated;
    });
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
      <ColorModeButtons />
      
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
            <MenuItem value="vf">Verdadeiro ou Falso</MenuItem>
            <MenuItem value="dissertativa">Dissertativa</MenuItem>
            <MenuItem value="numerica">Resposta Numérica</MenuItem>
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
        

      {/* Alternativas (agora escondidas para dissertativa E numérica) */}
      {!['dissertativa', 'numerica'].includes(tipo) && (
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
            {tipo === 'vf' ? (
              // INTERFACE PARA 'VERDADEIRO OU FALSO'
              alternativas.map((alt, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    value={index}
                    control={<Radio />}
                    label={<Typography sx={{ color: 'text.primary' }}>{alt.texto}</Typography>}
                  />
                </Box>
              ))
            ) : (

              // INTERFACE ANTIGA PARA 'MÚLTIPLA ESCOLHA'
              alternativas.map((alt, index) => (
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
              ))
            )}
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