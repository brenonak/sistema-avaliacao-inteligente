'use client';

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Box, Button, Typography, Container, Paper, CircularProgress } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useState, Suspense } from "react";

export const dynamic = 'force-dynamic';

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          textAlign: 'center',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Sistema Acadêmico
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Faça login para continuar
          </Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.dark">
              {error === "OAuthSignin" && "Erro ao iniciar login com Google"}
              {error === "OAuthCallback" && "Erro ao processar resposta do Google"}
              {error === "OAuthCreateAccount" && "Erro ao criar conta"}
              {error === "EmailCreateAccount" && "Erro ao criar conta com email"}
              {error === "Callback" && "Erro no callback de autenticação"}
              {error === "OAuthAccountNotLinked" && "Email já usado com outro método de login"}
              {error === "EmailSignin" && "Erro ao enviar email de login"}
              {error === "CredentialsSignin" && "Credenciais inválidas"}
              {error === "SessionRequired" && "É necessário fazer login"}
              {!["OAuthSignin", "OAuthCallback", "OAuthCreateAccount", "EmailCreateAccount", "Callback", "OAuthAccountNotLinked", "EmailSignin", "CredentialsSignin", "SessionRequired"].includes(error) && "Erro ao fazer login"}
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={loading}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          {loading ? "Conectando..." : "Entrar com Google"}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
          Apenas contas Google são aceitas
        </Typography>
      </Paper>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <LoginContent />
    </Suspense>
  );
}
