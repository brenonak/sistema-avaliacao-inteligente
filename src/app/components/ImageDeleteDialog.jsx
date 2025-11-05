'use client';
import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Divider,
  Box,
  Typography
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

export default function ImageDeleteDialog({
  open,
  imageName,
  hasQuestions,
  questionCount = 0,
  onClose,
  onConfirm,
  isDeleting = false
}) {
  const title = hasQuestions ? "Confirmar exclusão em cascata" : "Confirmar exclusão";
  const message = hasQuestions
    ? `Esta imagem está sendo usada em ${questionCount} ${
        questionCount === 1 ? "questão" : "questões"
      }. Se continuar, ${
        questionCount === 1 ? "esta questão será apagada" : "todas as questões relacionadas serão apagadas"
      } junto com a imagem.`
    : `Tem certeza que deseja apagar a imagem "${imageName}"?`;

  return (
    <Dialog
      open={open}
      onClose={!isDeleting ? onClose : undefined}
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            p: 1,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      }}
    >
      <DialogTitle
        id="confirm-delete-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <WarningAmber color="error" />
        {title}
      </DialogTitle>

      <Divider sx={{ mb: 1 }} />

      <DialogContent>
        <DialogContentText id="confirm-delete-description">
          {message}
        </DialogContentText>
        {hasQuestions && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark">
              Atenção: Esta ação não pode ser desfeita e afetará outras partes do sistema.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isDeleting}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isDeleting}
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}