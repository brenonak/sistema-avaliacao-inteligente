"use client";

import React from 'react';
import { Container, Typography } from '@mui/material';

export default function DashboardProvaPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4">Dashboard da Prova</Typography>
      <Typography color="text.secondary">Carregando dados...</Typography>
    </Container>
  );
}