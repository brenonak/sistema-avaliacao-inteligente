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
  DialogTitle,
  Chip
} from '@mui/material';
import { Save, Cancel, ContentCopy } from '@mui/icons-material';
import { set } from 'zod';
import { generateAccessCode } from '../../../../lib/code-generator';

export default function CriarCursoPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewCodigo, setPreviewCodigo] = useState('');
  const [previewSlug, setPreviewSlug] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialogOpen, setDialogOpen] = useState(false);

  // Gerar um código de acesso aleatório quando o componente carregar
  const handleNomeChange = (e) => {
    const novoNome = e.target.value;
    setNome(novoNome);
    
    if (novoNome.trim()) {
      const nomeFormatado = novoNome.trim();
      
      // Gerar código de acesso aleatório (6 caracteres alfanuméricos)
      const codigo = generateAccessCode(6);
      
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

    // Usar o código já gerado no preview
    const nomeFormatado = nome.trim();
    const codigo = previewCodigo;

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

  const handleCopyCodigo = () => {
    if (previewCodigo) {
      navigator.clipboard.writeText(previewCodigo).then(() => {
        setSnackbar({ open: true, message: 'Código copiado para a área de transferência!', severity: 'success' });
      }).catch(() => {
        setSnackbar({ open: true, message: 'Erro ao copiar código', severity: 'error' });
      });
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

        {/* Código de Acesso */}
        {previewCodigo && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: 'action.hover', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.main'
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Código de Acesso para Alunos:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={previewCodigo}
                variant="filled"
                color="primary"
                sx={{ fontSize: '1.1rem', height: 'auto', py: 1.5, px: 2 }}
              />
              <Button
                size="small"
                startIcon={<ContentCopy />}
                onClick={handleCopyCodigo}
                variant="outlined"
              >
                Copiar
              </Button>
            </Box>
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
