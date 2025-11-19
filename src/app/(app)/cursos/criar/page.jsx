'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import { set } from 'zod';

export default function CriarCursoPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewCodigo, setPreviewCodigo] = useState('');
  const [previewSlug, setPreviewSlug] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialogOpen, setDialogOpen] = useState(false);

  // Atualizar preview quando o nome mudar
  const handleNomeChange = (e) => {
    const novoNome = e.target.value;
    setNome(novoNome);
    
    if (novoNome.trim()) {
      const nomeFormatado = novoNome.trim();
      
      // Gerar código preview
      const codigo = nomeFormatado
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 10);
      
      // Gerar slug preview
      const slug = nomeFormatado
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      setPreviewCodigo(codigo);
      setPreviewSlug(slug);
    } else {
      setPreviewCodigo('');
      setPreviewSlug('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (nome.trim() === '') {
      setSnackbar({ open: true, message: 'Por favor, preencha o nome do curso.', severity: 'error' });
      return;
    }

    // Gerar código e slug a partir do nome
    const nomeFormatado = nome.trim();
    const codigo = nomeFormatado
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '') // Remove espaços
      .substring(0, 10); // Limita a 10 caracteres

    const slug = nomeFormatado
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens no início/fim

    const payload = {
      nome: nomeFormatado,
      codigo: codigo,
      slug: slug,
      descricao: descricao.trim() || undefined,
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
      setSnackbar({ open: true, message: 'Curso criado com sucesso!', severity: 'success' });
      setTimeout(() => {
        router.push('/cursos');
      }, 1500);

    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Erro ao criar curso' ,severity: 'error' });
      setLoading(false);
    } 
  };

  const handleCancel = () => {
    if (nome.trim() || descricao.trim()) {
      setDialogOpen(true);
    } else {
      router.push('/cursos');
    }
  };

  const handleDialogClose = (confirm) => {
    setDialogOpen(false);
    if (confirm) {
      router.push('/cursos');
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
          onChange={handleNomeChange}
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={dialogOpen}
        onClose={() => handleDialogClose(false)}
      >
        <DialogTitle>Descartar alterações?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você tem alterações não salvas. Tem certeza que deseja descartar essas alterações e sair?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDialogClose(false)} color="primary">
            Continuar Editando
          </Button>
          <Button onClick={() => handleDialogClose(true)} color="error" autoFocus>
            Descartar e Sair
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
