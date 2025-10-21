'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { Delete, ArrowBack } from '@mui/icons-material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import FileItem from '../../components/FileItem';
import AIButton from '../../components/AIButton';
import { upload } from "@vercel/blob/client";
import { set } from 'zod';
import ImageUploadSection from '../../components/ImageUploadSection';

export default function CriarQuestaoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cursoId = searchParams.get('cursoId');
  const cursoNome = searchParams.get('cursoNome');
  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState('alternativa');
  const [alternativas, setAlternativas] = useState([
    { texto: '', correta: true },
    { texto: '', correta: false },
  ]);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormFilled, setIsFormFilled] = useState(false);
  
  // Estados para ações de IA
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiGeneratingDistractors, setAiGeneratingDistractors] = useState(false);

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

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  }

  const showAIDevelopmentMessage = () => {
    setSnackbar({ open: true, message: 'Funcionalidade de IA em desenvolvimento.', severity: 'info' });
  }


  // Handlers para funcionalidades de IA (futuramente implementar)
  const handleGenerateEnunciadoWithAI = async () => {
    // 1. Validação de entrada: precisa de tags para ter contexto
    if (cleanTags.length === 0) {
      setSnackbar({ open: true, message: 'Adicione pelo menos uma tag para gerar um enunciado.', severity: 'warning' });
      return;
    }

    setAiGenerating(true);
    try {
        // 2. Montagem do payload (corpo da requisição)
        const payload = {
            tags: cleanTags,
            // Envia as alternativas se o tipo for de múltipla escolha
            alternativas: ['alternativa', 'afirmacoes', 'proposicoes'].includes(tipo) 
                ? alternativas.map(a => a.texto).filter(Boolean) // Envia apenas as preenchidas
                : [], // Envia array vazio para dissertativa/numérica
            enunciadoInicial: enunciado, // O enunciado atual serve como rascunho
        };
        
        console.log("Enviando payload para gerar enunciado:", payload);

        // 3. Chamada à API
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
        
        // 4. Atualização do estado com a resposta da IA
        setEnunciado(data.enunciadoGerado);

        setSnackbar({ open: true, message: 'Enunciado gerado com sucesso!', severity: 'success' });

    } catch (err) {
        console.error("Erro ao gerar enunciado:", err);
        setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
        setAiGenerating(false);
    }
  };

  const handleReviewSpellingWithAI = async () => {
    if (!enunciado.trim()) {
      setSnackbar({ open: true, message: 'Por favor, preencha o enunciado da questão.', severity: 'error' });
      return;
    }

    setAiReviewing(true);

    try {
      // Monta o payload dependendo do tipo de questão
      const payload = { enunciado };

      // Para cada tipo de questão, envia apenas os TEXTOS
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

      console.log('Enviando payload:', payload);

      // Chamada ao endpoint
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
      console.log('Resposta recebida:', data);

      // Atualiza o enunciado se foi revisado
      if (data.enunciadoRevisado) {
        setEnunciado(data.enunciadoRevisado);
      }

      // Atualiza alternativas (múltipla escolha)
      if (tipo === 'alternativa' && data.alternativasRevisadas) {
        setAlternativas(alternativas.map((a, i) => ({
          ...a,
          texto: data.alternativasRevisadas[i] || a.texto,
        })));
      }

      // Atualiza afirmações (V/F)
      if (tipo === 'afirmacoes' && data.afirmacoesRevisadas) {
        setAfirmacoes(afirmacoes.map((a, i) => ({
          ...a,
          texto: data.afirmacoesRevisadas[i] || a.texto,
        })));
      }

      // Atualiza proposições (somatório)
      if (tipo === 'proposicoes' && data.proposicoesRevisadas) {
        setProposicoes(proposicoes.map((p, i) => ({
          ...p,
          texto: data.proposicoesRevisadas[i] || p.texto,
        })));
      }

      // Atualiza gabarito (dissertativa)
      if (tipo === 'dissertativa' && data.gabaritoRevisado) {
        setGabarito(data.gabaritoRevisado);
      }

      setSnackbar({ 
        open: true, 
        message: 'Questão revisada com sucesso pela IA!', 
        severity: 'success' 
      });

    } catch (err) {
      console.error('Erro na revisão:', err);
      setSnackbar({ 
        open: true, 
        message: err.message || 'Erro ao revisar questão com IA.', 
        severity: 'error' 
      });
    } finally {
      setAiReviewing(false);
    }
  };

const handleGenerateDistractorsWithAI = async () => {
    // Validação inicial (permanece a mesma)
    const alternativaCorreta = alternativas.find(a => a.correta);
    if (!enunciado.trim() || !alternativaCorreta || !alternativaCorreta.texto.trim()) {
        setSnackbar({ 
            open: true, 
            message: 'Para gerar distratores, preencha o enunciado e a alternativa correta.', 
            severity: 'warning' 
        });
        return;
    }

    // MODIFICAÇÃO 1: Contar quantos campos de alternativa estão vazios.
    const quantidadeVazias = alternativas.filter(a => a.texto.trim() === '').length;

    // Se não houver campos vazios, não há o que fazer.
    if (quantidadeVazias === 0) {
        setSnackbar({ 
            open: true, 
            message: 'Não há alternativas vazias para preencher com a IA.', 
            severity: 'info' 
        });
        return;
    }

    setAiGeneratingDistractors(true);
    try {
        // MODIFICAÇÃO 2: Enviar a contagem de vazias no payload.
        const payload = {
            enunciado: enunciado,
            alternativaCorreta: alternativaCorreta.texto,
            tags: cleanTags,
            quantidade: quantidadeVazias // Envia o número exato de distratores necessários
        };
        
        console.log("Enviando payload para gerar distratores:", payload);

        const res = await fetch("/api/ai/gerar-alternativa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        
        // Tratamento de erro robusto (com res.clone())
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

        // MODIFICAÇÃO 3: Lógica para preencher apenas os campos vazios.
        let distractorIndex = 0;
        const novasAlternativas = alternativas.map(alt => {
            // Se a alternativa atual estiver vazia E ainda tivermos distratores gerados para usar...
            if (alt.texto.trim() === '' && distractorIndex < distratoresGerados.length) {
                // Preenche o texto com o próximo distrator da lista.
                const textoDoDistrator = distratoresGerados[distractorIndex];
                distractorIndex++;
                return { ...alt, texto: textoDoDistrator };
            }
            // Caso contrário, mantém a alternativa como está (seja ela preenchida ou vazia, se acabaram os distratores).
            return alt;
        });
        
        setAlternativas(novasAlternativas);

        setSnackbar({ open: true, message: 'Alternativas vazias preenchidas com sucesso!', severity: 'success' });

    } catch (err) {
        console.error("Erro ao gerar distratores:", err);
        setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
        setAiGeneratingDistractors(false);
    }
};
  
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
      setSnackbar({ open: true, message: 'Por favor, preencha o enunciado da questão.', severity: 'error' });
      return;
    }
    
    // Validações específicas por tipo de questão
    if (tipo === 'alternativa' || tipo === 'vf') {
      if (alternativas.some((a) => a.texto.trim() === '')) {
        setSnackbar({ open: true, message: 'Todas as alternativas devem ser preenchidas.', severity: 'error' });
        return;
      }
      if (!alternativas.some((a) => a.correta)) {
        setSnackbar({ open: true, message: 'Por favor, marque uma alternativa como correta.', severity: 'error' });
        return;
      }
    }
    
    // Validação para questão numérica
    if (tipo === 'numerica' && !respostaNumerica) {
      setSnackbar({ open: true, message: 'Por favor, preencha a resposta correta para a questão numérica.', severity: 'error' });
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
        setSnackbar({ open: true, message: 'Falha ao enviar arquivos. Tente novamente.', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Questão criada com sucesso!', severity: 'success' });

      // limpar formulário completo (inclui arquivos e uploads)
      handleClearForm();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: e.message || 'Erro ao salvar questão.', severity: 'error' });
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
      <Box sx={{ width: '100%', maxWidth: 600, position: 'relative', mb: 2 }}>
        {cursoId && cursoNome && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push(`/cursos/${cursoId}`)}
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              mb: 2
            }}
          >
            Voltar para {decodeURIComponent(cursoNome)}
          </Button>
        )}
        
        <Typography variant="h4" component="h1" sx={{ 
          mb: 4, 
          mt: cursoId && cursoNome ? 6 : 0, 
          fontWeight: 'bold', 
          color: 'text.primary', 
          textAlign: 'center' 
        }}>
          Criar Nova Questão
        </Typography>
      </Box>

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
            MenuProps={{
              disableScrollLock: true, 
            }}
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
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => setAlternativas([...alternativas, { texto: '', correta: false }])}
              >
                + Adicionar alternativa
              </Button>
            </Box>
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
          //required // Indicar que é obrigatório
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right'}}>
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%', fontSize: '1.1rem' }}>
          {snackbar.message}
        </Alert>
        </Snackbar>
    </Box>
  );
}