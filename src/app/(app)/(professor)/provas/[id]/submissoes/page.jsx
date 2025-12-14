'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Edit,
  CheckCircle,
  HourglassEmpty,
  Person,
  Assignment,
  School,
} from '@mui/icons-material';
import Link from 'next/link';



export default function SubmissoesProvaPage() {
  const params = useParams();
  const router = useRouter();
  const provaId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prova, setProva] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estatisticas, setEstatisticas] = useState({});

  useEffect(() => {
    if (!provaId) return;

    const fetchSubmissoes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/provas/${provaId}/submissoes`);
        if (!response.ok) {
          throw new Error('Erro ao carregar submissões');
        }

        const data = await response.json();
        setProva(data.prova);
        setAlunos(data.submissoes);
        setEstatisticas(data.estatisticas);
      } catch (err) {
        console.error('Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissoes();
  }, [provaId]);

  // Filtra alunos pela busca
  const filteredAlunos = alunos.filter(
    (aluno) =>
      aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const totalAlunos = estatisticas.totalAlunos || 0;
  const corrigidos = estatisticas.corrigidos || 0;
  const pendentes = estatisticas.pendentes || 0;
  const mediaNotas = estatisticas.mediaNotas || 0;

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography color="error" variant="h6">
          Erro: {error}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  if (!prova) {
    return (
      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography>Prova não encontrada</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href={`/provas/${provaId}/dashboard`}
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          Voltar para Dashboard
        </Button>

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Submissões da Prova
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <Assignment fontSize="small" />
          <Typography variant="subtitle1">
            {prova?.titulo} • {prova?.disciplina}
          </Typography>
        </Box>
      </Box>

      {/* Cards de Estatísticas */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1, borderLeft: '4px solid #2196f3' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Total de Alunos
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {totalAlunos}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#e3f2fd', color: '#2196f3' }}>
                <Person />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderLeft: '4px solid #4caf50' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Corrigidos
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {corrigidos}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#e8f5e9', color: '#4caf50' }}>
                <CheckCircle />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderLeft: '4px solid #ff9800' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Pendentes
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {pendentes}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#fff3e0', color: '#ff9800' }}>
                <HourglassEmpty />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderLeft: '4px solid #9c27b0' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Média das Notas
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="secondary.main">
                  {mediaNotas.toFixed(1)}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#f3e5f5', color: '#9c27b0' }}>
                <School />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Barra de Busca */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar aluno por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Paper>

      {/* Tabela de Alunos */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Aluno</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                Nota
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAlunos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhum aluno encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlunos.map((aluno) => (
                <TableRow
                  key={aluno.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                        {aluno.nome.charAt(0)}
                      </Avatar>
                      <Typography fontWeight="medium">{aluno.nome}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary" variant="body2">
                      {aluno.email}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={aluno.status === 'corrigido' ? 'Corrigido' : 'Pendente'}
                      color={aluno.status === 'corrigido' ? 'success' : 'warning'}
                      size="small"
                      icon={
                        aluno.status === 'corrigido' ? (
                          <CheckCircle fontSize="small" />
                        ) : (
                          <HourglassEmpty fontSize="small" />
                        )
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    {aluno.nota !== null ? (
                      <Typography
                        fontWeight="bold"
                        color={aluno.nota >= 6 ? 'success.main' : 'error.main'}
                      >
                        {aluno.nota.toFixed(1)}
                      </Typography>
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      title={aluno.status === 'corrigido' ? 'Editar correção' : 'Corrigir'}
                    >
                      <Button
                        component={Link}
                        href={`/correcao`}
                        variant={aluno.status === 'pendente' ? 'contained' : 'outlined'}
                        size="small"
                        startIcon={<Edit />}
                        color={aluno.status === 'pendente' ? 'primary' : 'inherit'}
                      >
                        {aluno.status === 'corrigido' ? 'Editar' : 'Corrigir'}
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resumo no rodapé */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Mostrando {filteredAlunos.length} de {totalAlunos} alunos •{' '}
          {corrigidos} corrigidos • {pendentes} pendentes
        </Typography>
      </Box>
    </Box>
  );
}
