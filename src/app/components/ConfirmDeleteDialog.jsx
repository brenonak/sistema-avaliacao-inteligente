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
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

export default function ConfirmDeleteDialog({
  open,
  elementText = 'este elemento',
  onClose,
  onConfirm,
}) {

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <WarningAmber color='error'/>
        Confirmar exclusão
      </DialogTitle>

      <Divider sx={{ mb: 1 }} />

      <DialogContent>
        <DialogContentText
          id="confirm-delete-description"
        >
          Tem certeza que deseja excluir <b>{elementText}</b>?  
          A ação não poderá ser desfeita.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
        >
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
