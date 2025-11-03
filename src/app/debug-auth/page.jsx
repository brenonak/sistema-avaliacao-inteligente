'use client';

import { useSession } from "next-auth/react";
import { Container, Paper, Typography, Box, CircularProgress } from "@mui/material";

export default function DebugAuthPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5">Você não está autenticado</Typography>
          <Typography>Faça login para ver suas informações de sessão.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Debug de Autenticação
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Informações da Sessão:
          </Typography>
          
          <Box sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.9rem' }}>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {JSON.stringify(session, null, 2)}
            </pre>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>User ID:</strong> {session?.user?.id || 'Não disponível'}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Email:</strong> {session?.user?.email || 'Não disponível'}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Nome:</strong> {session?.user?.name || 'Não disponível'}
            </Typography>
          </Box>

          <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff3cd', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>⚠️ Importante:</strong> O userId mostrado acima é o que está sendo usado 
              para criar/listar cursos e questões. Certifique-se de que este é o ID correto 
              que possui os recursos no banco de dados.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
