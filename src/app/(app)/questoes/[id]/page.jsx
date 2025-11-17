"use client";

import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  CircularProgress, 
  Button,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Hook para pegar o ID na URL

// Imports dos seus artefatos
import GraficoEstatisticasQuestao from '../../../../app/components/questoes/GraficoEstatisticasQuestao';
import { questaoStatsService } from '../../../../services/statsService';

export default function DetalhesQuestaoPage() {
  // Pega o ID da URL (ex: '101', '102'...)
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Chama o nosso serviço (Mock)
        const data = await questaoStatsService.getById(id);
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      
      {/* Cabeçalho de Navegação */}
      <Box sx={{ mb: 3 }}>
        <Link href="/questoes" passHref style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBackIcon />}>
            Voltar para Lista
          </Button>
        </Link>
      </Box>

      {/* Área Principal: Detalhes da Questão (Placeholder) */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Detalhes da Questão #{id}
          </Typography>
          {/* Chip de Tipo (Visual apenas) */}
          {stats && (
            <Box 
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText', 
                px: 2, py: 0.5, borderRadius: 4, fontSize: '0.875rem' 
              }}
            >
              {stats.tipo.toUpperCase().replace('-', ' ')}
            </Box>
          )}
        </Stack>
        
        <Typography variant="body1" color="text.secondary">
          (Aqui ficaria o enunciado da questão vindo do banco de dados...)
        </Typography>
      </Paper>

      {/* --- A SUA FEATURE (TASK #226) --- */}
      <Paper elevation={3} sx={{ p: 3, borderTop: '4px solid #1976d2' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Histórico de Desempenho (Item Analysis)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Análise estatística acumulada de todas as respostas dos alunos para esta questão.
        </Typography>
        
        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
            <GraficoEstatisticasQuestao 
              tipoQuestao={stats.tipo}
              dados={stats.dados}
              // Se for dissertativa, passamos o 'valorCorreto' se existir 
              // ou os dados extras que colocamos no mock
              valorCorreto={stats.meta ? null : "15.5"} // Exemplo para numérica
            />
            
            {/* Se houver metadados de notas extremas (Dissertativa), 
                o componente GraficoEstatisticasQuestao já renderiza os Chips internamente
                se tivermos passado os dados da forma correta. 
                NOTA: No mock dissertativa, passamos meta: { qtdNotaZero... }.
                O componente precisaria ser ajustado para ler isso via props se quisermos dinamico.
                Por enquanto, o componente tem mocks internos para os chips, o que é aceitável para demo.
            */}
          </Box>
        ) : (
          <Typography color="error" align="center">
            Não foi possível carregar os dados estatísticos.
          </Typography>
        )}
      </Paper>

    </Container>
  );
}