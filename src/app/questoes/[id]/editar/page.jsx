"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  CircularProgress,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import ColorModeButtons from '../../../components/ColorModeButtons';

export default function EditarQuestaoPage() {
  const params = useParams();
  const router = useRouter();
  const id = useMemo(() => (params?.id ? String(params.id) : ''), [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState('alternativa');
  const [alternativas, setAlternativas] = useState([]);
  const [gabarito, setGabarito] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const indexToLetter = (i) => String.fromCharCode(65 + i);

  useEffect(() => {
    let abort = false;
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/questoes/${id}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `Falha ao carregar (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (abort) return;
        setEnunciado(data.enunciado || '');
        setTipo(data.tipo || 'alternativa');
        setAlternativas(Array.isArray(data.alternativas) ? data.alternativas.map((a, i) => ({
          texto: a.texto ?? '',
          correta: !!a.correta,
          letra: a.letra ?? indexToLetter(i),
        })) : []);
        setGabarito(data.gabarito || '');
        setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : '');
        setError('');
      } catch (e) {
        console.error(e);
        setError(e.message || 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
    return () => { abort = true; };
  }, [id]);

  const cleanTags = useMemo(() => (
    tagsInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10)
  ), [tagsInput]);

  const handleSave = async (event) => {
    event.preventDefault();

    if (enunciado.trim() === '') {
      alert('Por favor, preencha o enunciado da questão.');
      return;
    }

    // Monta payload parcial (PUT aceita parcial no backend)
    const payload = tipo === 'dissertativa'
      ? {
          tipo,
          enunciado,
          alternativas: [],
          gabarito,
          tags: cleanTags,
        }
      : {
          tipo,
          enunciado,
          alternativas: alternativas.map((a, i) => ({
            letra: a.letra ?? indexToLetter(i),
            texto: a.texto,
            correta: !!a.correta,
          })),
          gabarito: undefined,
          tags: cleanTags,
        };

    try {
      setSaving(true);
      const res = await fetch(`/api/questoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Falha ao salvar (HTTP ${res.status})`);
      }
      await res.json();
      alert('Questão atualizada com sucesso!');
      router.push('/questoes');
      router.refresh?.();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
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
        Editar Questão
      </Typography>

      <Paper
        component="form"
        onSubmit={handleSave}
        sx={{
          width: '100%',
          maxWidth: 600,
          p: 4,
          backgroundColor: 'background.paper'
        }}
      >
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
          </Select>
        </FormControl>

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

        {tipo !== 'dissertativa' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'text.primary' }}>
              Alternativas:
            </Typography>
            <RadioGroup
              name="alternativaCorreta"
              value={Math.max(0, alternativas.findIndex(alt => alt.correta))}
              onChange={(e) => {
                const selectedIndex = parseInt(e.target.value);
                const novas = alternativas.map((a, i) => ({ ...a, correta: i === selectedIndex }));
                setAlternativas(novas);
              }}
            >
              {alternativas.map((alt, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FormControlLabel
                    value={index}
                    control={<Radio />}
                    label=""
                    sx={{ margin: 0, marginRight: 1 }}
                  />
                  <TextField
                    value={alt.texto}
                    onChange={(e) => {
                      const novoTexto = e.target.value;
                      const novas = alternativas.map((a, i) =>
                        i === index ? { ...a, texto: novoTexto } : a
                      );
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
                        if (alt.correta && novas.length) novas[0].correta = true;
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
            <Button
              variant="outlined"
              onClick={() => setAlternativas([...alternativas, { texto: '', correta: false, letra: indexToLetter(alternativas.length) }])}
              sx={{ mt: 1 }}
            >
              + Adicionar alternativa
            </Button>
          </Box>
        )}

        {tipo === 'dissertativa' && (
          <TextField
            id="gabarito"
            label="Gabarito"
            multiline
            rows={3}
            value={gabarito}
            onChange={(e) => setGabarito(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />
        )}

        <TextField
          id="tags"
          label="Tags (separadas por vírgula)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            fullWidth
            color="primary"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>

          <Button
            type="button"
            variant="outlined"
            onClick={() => router.push('/questoes')}
            disabled={saving}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}


