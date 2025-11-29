"use client";

import React, { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'next/navigation';
import { dashboardService } from '@/services/dashboardService';

export default function DashboardProvaPage() {
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const analytics = await dashboardService.getProvaAnalytics(id);
        setData(analytics);
      } catch (err) {
        console.error(err);
        setError('Falha ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4">Dashboard da Prova #{id}</Typography>
      {/* Apenas para testar se o dado chegou (JSON dump) */}
      <pre>{JSON.stringify(data?.resumo, null, 2)}</pre>
    </Container>
  );
}