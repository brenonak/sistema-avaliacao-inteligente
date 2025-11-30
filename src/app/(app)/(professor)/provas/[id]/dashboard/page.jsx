"use client";

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress, 
  Stack,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  People as PeopleIcon, 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Functions as FunctionsIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { dashboardService } from '../../../../../../services/dashboardService';
import HistogramaNotas from '../../../../../components/questoes/charts/HistogramaNotas';

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
        setError('Falha ao carregar dados da dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Função auxiliar para renderizar um Card de Resumo (KPI)
  const renderSummaryCard = (title, value, icon, color) => (
    <Card 
      elevation={0} // Remove a sombra padrão para um look mais limpo
      sx={{ 
        height: '100%', 
        borderLeft: `6px solid ${color}`, // Borda colorida mais grossa
        borderTop: '1px solid #e0e0e0',
        borderRight: '1px solid #e0e0e0',
        borderBottom: '1px solid #e0e0e0',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)', // Efeito de "levantar" ao passar o mouse
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}> {/* Mais padding */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography 
              variant="overline" 
              color="text.secondary" 
              fontWeight="bold" 
              sx={{ letterSpacing: 1.2, display: 'block', mb: 1 }}
            >
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="800" sx={{ color: 'text.primary' }}>
              {value}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              color: color, 
              p: 1.5, 
              borderRadius: 3, // Canto arredondado
              bgcolor: `${color}15`, // Fundo transparente da cor do ícone
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
              
            }}
          >
            {/* Clona o ícone para aumentar o tamanho dele */}
            {React.cloneElement(icon, { sx: { fontSize: 32 } })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Dados não encontrados'}</Alert>
        <Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} LinkComponent={Link} href="/provas">
          Voltar
        </Button>
      </Container>
    );
  }

  const { resumo } = data;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      
      {/* 1. Cabeçalho e Navegação */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Link href="/provas" passHref style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBackIcon />} color="inherit">
            Voltar
          </Button>
        </Link>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Dashboard da Prova
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visualizando análise estatística para a prova ID: #{id}
          </Typography>
        </Box>
      </Stack>

      {/* 2. Seção de Cards de Resumo (KPIs) */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'medium', textAlign: 'center'}}>
        Resumo Geral
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 6 }} justifyContent="center">
        <Grid item xs={12} sm={6} md={3}>
          {renderSummaryCard('Média da Turma', resumo.mediaGeral.toFixed(1), <FunctionsIcon />, '#1976d2')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderSummaryCard('Total de Alunos', resumo.totalAlunos, <PeopleIcon />, '#ed6c02')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderSummaryCard('Maior Nota', resumo.maiorNota.toFixed(1), <TrendingUpIcon />, '#2e7d32')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderSummaryCard('Menor Nota', resumo.menorNota.toFixed(1), <TrendingDownIcon />, '#d32f2f')}
        </Grid>
      </Grid>

      <Divider sx={{ mb: 4 }} />

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
              Distribuição de Notas
      </Typography>

      <HistogramaNotas 
        dados={data.distribuicaoNotas.dados} 
        meta={data.distribuicaoNotas.meta} 
      />
    </Container>
  );
}