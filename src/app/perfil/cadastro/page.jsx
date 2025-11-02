"use client";

import React from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper 
} from '@mui/material';

export default function PaginaCadastro() {

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', // Centraliza na página
        py: 4 
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 3, md: 5 }, // Padding interno
          width: '100%',
          borderRadius: 2 // Bordas arredondadas
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ fontWeight: 'bold', textAlign: 'center' }}
        >
          Finalize seu Cadastro
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ textAlign: 'center', mb: 4 }}
        >
          Precisamos de mais algumas informações para completar seu perfil.
        </Typography>

        {/* Placeholder para a Task #167:
          O <Box component="form"> e os <TextField>
          serão adicionados aqui.
        */}
        <Box 
          sx={{ 
            minHeight: '200px', 
            border: (theme) => `2px dashed ${theme.palette.divider}`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'text.disabled',
            borderRadius: 1,
            p: 2
          }}
        >
          (Conteúdo do Formulário - Task #167 Pendente)
        </Box>

      </Paper>
    </Container>
  );
}