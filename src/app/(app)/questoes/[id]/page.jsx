"use client";

import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Chip,
  Button,
  Stack,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Hook para pegar o ID na URL
import { Assignment, Description, CheckCircleOutline, HighlightOff } from '@mui/icons-material';

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

  const toRoman = (num) => {
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return romans[num] || String(num + 1);
  };

  const RenderGabarito = ({ gabarito }) => {
    if (!gabarito) return null;

    switch (gabarito.tipo) {
      // PADRÃO: Lista de Múltipla Escolha
      case 'alternativa':
        return (
          <List dense>
            {gabarito.alternativas?.map((alt, index) => (
              <ListItem key={index} sx={{ pl: 2 }}>
                <ListItemText
                  primary={`${(alt.letra || String.fromCharCode(65 + index))}) ${alt.texto} ${alt.correta ? '(Correta)' : ''}`}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: alt.correta ? 'bold' : 'normal',
                      color: alt.correta ? 'success.main' : 'text.secondary'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        );

      // PADRÃO: Lista de Afirmações (V/F)
      case 'afirmacoes':
        return (
          <List dense>
            {gabarito.afirmacoes.map((af, index) => (
              <ListItem key={index} sx={{ pl: 2, alignItems: 'flex-start' }}>
                <Typography sx={{ mr: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                  {toRoman(index)}.
                </Typography>
                <Typography sx={{ mr: 1, fontWeight: 'bold', color: af.correta ? 'success.main' : 'error.main' }}>
                  ({af.correta ? 'V' : 'F'})
                </Typography>
                <ListItemText primary={af.texto} sx={{ color: 'text.secondary' }} />
              </ListItem>
            ))}
          </List>
        );

      // PADRÃO: Lista de Proposições (Soma)
      case 'proposicoes':
        const somaCorreta = gabarito.proposicoes.reduce((acc, p) => acc + (p.correta ? (Number(p.valor) || 0) : 0), 0);
        return (
          <>
            <List dense>
              {gabarito.proposicoes.map((p, index) => (
                <ListItem key={index} sx={{ pl: 2, alignItems: 'flex-start' }}>
                  <Typography sx={{ mr: 1, fontWeight: 'bold', color: 'text.secondary', fontFamily: 'monospace' }}>
                    {String(p.valor).padStart(2, '0')}
                  </Typography>
                  <Typography sx={{ mr: 1, fontWeight: 'bold', color: p.correta ? 'success.main' : 'error.main' }}>
                    ({p.correta ? 'V' : 'F'})
                  </Typography>
                  <ListItemText primary={p.texto} sx={{ color: 'text.secondary' }} />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1, display: 'inline-block' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                Gabarito (Soma):{' '}
                <Typography component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  {somaCorreta}
                </Typography>
              </Typography>
            </Box>
          </>
        );

      // PADRÃO: Numérica
      case 'numerica':
        return (
          <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1, display: 'inline-block' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              Resposta correta: {gabarito.respostaCorreta}
              {gabarito.margemErro > 0 && ` (± ${gabarito.margemErro})`}
            </Typography>
          </Box>
        );

      // PADRÃO: Dissertativa
      case 'dissertativa':
        return (
          <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Gabarito: {gabarito.gabaritoDissertativo || "Gabarito não fornecido."}
            </Typography>
          </Box>
        );

      default:
        return <Typography color="error">Tipo de gabarito desconhecido: {gabarito.tipo}</Typography>;
    }
  };

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

        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
          {loading ? "Carregando enunciado..." : (stats?.enunciado || "Enunciado não encontrado.")}
        </Typography>
        {!loading && stats?.vinculos && (
          <Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              Questão vinculada em:
            </Typography>
            <Grid container spacing={2}>

              {/* Coluna de Provas */}
              <Grid item xs={12} md={6}>
                <List
                  dense
                  subheader={
                    <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '2em', fontWeight: 'bold' }}>
                      Provas ({stats.vinculos.provas.length})
                    </ListSubheader>
                  }
                  sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1 }}
                >
                  {stats.vinculos.provas.length === 0 ? (
                    <ListItem><ListItemText secondary="Não usada em nenhuma prova." /></ListItem>
                  ) : (
                    stats.vinculos.provas.map(prova => (
                      <ListItem
                        key={prova.id}
                        component={Link}
                        href={`/cursos/${prova.cursoId}`}
                        title={`Ir para o curso (ID: ${prova.cursoId})`}
                        sx={{ '&:hover': { bgcolor: 'background.paper' }, borderRadius: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}><Assignment fontSize="small" color="primary" /></ListItemIcon>
                        <ListItemText primary={prova.titulo} />
                      </ListItem>
                    ))
                  )}
                </List>
              </Grid>

              {/* Coluna de Listas de Exercícios */}
              <Grid item xs={12} md={6}>
                <List
                  dense
                  subheader={
                    <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '2em', fontWeight: 'bold' }}>
                      Listas de Exercícios ({stats.vinculos.listas.length})
                    </ListSubheader>
                  }
                  sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1 }}
                >
                  {stats.vinculos.listas.length === 0 ? (
                    <ListItem><ListItemText secondary="Não usada em nenhuma lista." /></ListItem>
                  ) : (
                    stats.vinculos.listas.map(lista => (
                      <ListItem
                        key={lista.id}
                        component={Link}
                        href={`/cursos/${lista.cursoId}`}
                        title={`Ir para o curso (ID: ${lista.cursoId})`}
                        sx={{ '&:hover': { bgcolor: 'background.paper' }, borderRadius: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}><Description fontSize="small" color="primary" /></ListItemIcon>
                        <ListItemText primary={lista.titulo} />
                      </ListItem>
                    ))
                  )}
                </List>
              </Grid>
            </Grid>
          </Box>
        )}
        {!loading && stats?.gabarito && (
          <Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              Gabarito da Questão
            </Typography>
            <RenderGabarito gabarito={stats.gabarito} />
          </Box>
        )}
      </Paper>

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