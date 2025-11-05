"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';


export default function CardOptionsButton({ cursoId, onDelete, cursoNome, cursoDescricao }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editNome, setEditNome] = useState(cursoNome || '');
  const [editDescricao, setEditDescricao] = useState(cursoDescricao || '');
  const [loading, setLoading] = useState(false);

  const handleMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleClose();
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao excluir curso');
      }

      setOpenDeleteDialog(false);
      
      // Chama callback se fornecido para atualizar a lista
      if (onDelete) {
        onDelete(cursoId);
      }
      
      // Feedback de sucesso
      alert('Curso excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      alert(error.message || 'Erro ao excluir curso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleClose();
    setEditNome(cursoNome || '');
    setEditDescricao(cursoDescricao || '');
    setOpenEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!editNome.trim()) {
      alert('O nome do curso é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: editNome.trim(),
          descricao: editDescricao.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao atualizar curso');
      }

      setOpenEditDialog(false);
      
      // Recarrega a página para mostrar as mudanças
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      alert(error.message || 'Erro ao atualizar curso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Se não há funções específicas, retorna apenas o ícone sem menu
  if (!cursoId && !onDelete) {
    return (
      <IconButton
        size="large"
        aria-label="options"
        color="inherit"
        disabled
      >
        <MoreVertIcon />
      </IconButton>
    );
  }

  return (
    <>
      <IconButton
        size="large"
        aria-label="course options"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit"
      >
        <MoreVertIcon />
      </IconButton>
      
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        disableScrollLock={true}
      >
        <MenuItem onClick={handleEditClick}>Editar</MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>Excluir</MenuItem>
      </Menu>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => !loading && setOpenDeleteDialog(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o curso "{cursoNome}"? 
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={loading} autoFocus>
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog
        open={openEditDialog}
        onClose={() => !loading && setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Editar Curso</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Curso"
            type="text"
            fullWidth
            variant="outlined"
            value={editNome}
            onChange={(e) => setEditNome(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            margin="dense"
            label="Descrição"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={editDescricao}
            onChange={(e) => setEditDescricao(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleEditSave} variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}