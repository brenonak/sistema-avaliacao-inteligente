'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';

export default function CriarCursoPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (nome.trim() === '') {
      alert('Por favor, preencha o nome do curso.');
      return;
    }

    const payload = {
      nome: nome.trim(),
      descricao: descricao.trim(),
    };

    try {
      setLoading(true);
      const res = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Erro ao criar curso!');
      }
      alert('Curso criado com sucesso!');
      router.push('/cursos');
    } catch (e) {
      alert(e.message || 'Erro ao criar curso.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (nome.trim() || descricao.trim()) {
      if (confirm('Tem certeza que deseja cancelar? As informações não serão salvas.')) {
        router.push('/cursos');
      }
    } else {
      router.push('/cursos');
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
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold', color: 'text.primary' }}>
        Criar Novo Curso
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
        {/* Nome do Curso */}
        <TextField
          id="nome"
          label="Nome do Curso"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          fullWidth
          required
          sx={{ mb: 3 }}
          helperText="Nome obrigatório"
        />

        {/* Descrição */}
        <TextField
          id="descricao"
          label="Descrição"
          multiline
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          helperText="Descrição opcional do curso"
        />

        {/* Botões */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            color="primary"
            startIcon={<Save />}
          >
            {loading ? 'Criando...' : 'Criar Curso'}
          </Button>

          <Button
            type="button"
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
            startIcon={<Cancel />}
            sx={{
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'error.contrastText',
                borderColor: 'error.main',
              },
            }}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
