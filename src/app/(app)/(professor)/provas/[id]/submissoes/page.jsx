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

// Dados mockados de alunos para demonstração
const mockAlunos = [
  { id: '1', nome: 'Ana Silva', email: 'ana.silva@email.com', status: 'corrigido', nota: 8.5 },
  { id: '2', nome: 'Bruno Santos', email: 'bruno.santos@email.com', status: 'pendente', nota: null },
  { id: '3', nome: 'Carla Oliveira', email: 'carla.oliveira@email.com', status: 'corrigido', nota: 9.0 },
  { id: '4', nome: 'Daniel Costa', email: 'daniel.costa@email.com', status: 'pendente', nota: null },
  { id: '5', nome: 'Elena Ferreira', email: 'elena.ferreira@email.com', status: 'corrigido', nota: 7.5 },
  { id: '6', nome: 'Felipe Rodrigues', email: 'felipe.rodrigues@email.com', status: 'pendente', nota: null },
  { id: '7', nome: 'Gabriela Lima', email: 'gabriela.lima@email.com', status: 'corrigido', nota: 10.0 },
  { id: '8', nome: 'Henrique Almeida', email: 'henrique.almeida@email.com', status: 'pendente', nota: null },
];

// Dados mockados da prova
const mockProva = {
  id: '1',
  titulo: 'Prova de Cálculo I',
  disciplina: 'Cálculo I',
  professor: 'Prof. João Silva',
  data: '2025-12-10',
  totalQuestoes: 5,
  valorTotal: 10,
};

export default function SubmissoesProvaPage() {
  const params = useParams();
  const router = useRouter();
  const provaId = params?.id;

  const [loading, setLoading] = useState(true);
  const [prova, setProva] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simula carregamento de dados
    const timer = setTimeout(() => {
      setProva(mockProva);
      setAlunos(mockAlunos);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [provaId]);

  // Filtra alunos pela busca
  const filteredAlunos = alunos.filter(
    (aluno) =>
      aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const totalAlunos = alunos.length;
  const corrigidos = alunos.filter((a) => a.status === 'corrigido').length;
  const pendentes = alunos.filter((a) => a.status === 'pendente').length;
  const mediaNotas = alunos
    .filter((a) => a.nota !== null)
    .reduce((acc, a, _, arr) => acc + a.nota / arr.length, 0);

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
                        href={`/provas/${provaId}/submissoes/${aluno.id}`}
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
