"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Container, 
  Box, 
  Typography, 
  Paper,
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  FormControlLabel, 
  Checkbox,
  Autocomplete,
  Chip,
  Alert
} from '@mui/material';

export default function PaginaCadastro() {
    const { data: session } = useSession();
    const router = useRouter();

    // Estados para controlar os campos do formulário
    const [nome, setNome] = useState('');
    const [role, setRole] = useState(''); // 'ALUNO' ou 'PROFESSOR'
    const [instituicao, setInstituicao] = useState('');
    const [curso, setCurso] = useState('');
    const [areasInteresse, setAreasInteresse] = useState([]); // Para o Autocomplete
    const [foto, setFoto] = useState(null); // Para o upload
    const [nomeArquivoFoto, setNomeArquivoFoto] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pré-preencher nome e verificar se perfil já está completo
    useEffect(() => {
        if (session?.user?.name) {
            setNome(session.user.name);
        }
        // Se o perfil já estiver completo, redirecionar para dashboard
        if (session?.user?.profileComplete === true) {
            console.log('[Cadastro] Perfil já completo, redirecionando para dashboard');
            router.push('/dashboard');
        }
    }, [session, router]);

    // Handler para a seleção de foto
    const handleFotoChange = (event) => {
        if (event.target.files && event.target.files[0]) {
        const arquivo = event.target.files[0];
        setFoto(arquivo);
        setNomeArquivoFoto(arquivo.name);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Preparar dados para envio
            const profileData = {
                nome: nome.trim(),
                role,
                instituicao: instituicao.trim() || undefined,
                curso: curso.trim() || undefined,
                areasInteresse: areasInteresse.length > 0 ? areasInteresse : undefined,
            };

            // Enviar para API
            const response = await fetch('/api/profile/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao salvar perfil');
            }

            console.log('Perfil salvo com sucesso:', data);
            
            // Forçar atualização da sessão (para atualizar os callbacks JWT/Session)
            await fetch('/api/auth/session?update=1');
            
            // Pequeno delay para garantir que a sessão foi atualizada
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Redirecionar para dashboard baseado na role
            if (role === 'ALUNO') {
                router.push('/aluno/dashboard');
            } else {
                router.push('/dashboard');
            }
            router.refresh(); // Força reload da página
        } catch (err) {
            console.error('Erro ao salvar perfil:', err);
            setError(err.message || 'Erro ao salvar perfil. Tente novamente.');
            setLoading(false);
        }
    };

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

        <Box component="form" onSubmit={handleSubmit} noValidate>
          
            {/* Mensagem de erro */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Campo Nome Completo */}
            <TextField
            label="Nome Completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            fullWidth
            required
            margin="normal"
            />

            {/* Campo Role (Professor/Aluno) */}
            <FormControl fullWidth required margin="normal">
            <InputLabel id="role-select-label">Seu papel principal</InputLabel>
            <Select
                labelId="role-select-label"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="Seu papel principal"
            >
                <MenuItem value=""><em>Selecione um papel...</em></MenuItem>
                <MenuItem value="PROFESSOR">Professor</MenuItem>
                <MenuItem value="ALUNO">Aluno</MenuItem>
            </Select>
            </FormControl>

            {/* Campo Instituição */}
            <TextField
            label="Instituição de Ensino"
            value={instituicao}
            onChange={(e) => setInstituicao(e.target.value)}
            fullWidth
            margin="normal"
            />

            {/* Campo Curso */}
            <TextField
                label="Curso"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                fullWidth
                margin="normal"
                helperText="Ex: Engenharia de Software, 3º Período"
            />

            {/* Campo Áreas de Interesse */}
            <Autocomplete
                multiple
                freeSolo // Permite que o usuário digite valores que não estão na lista
                options={[]} // Sem sugestões por enquanto
                value={areasInteresse}
                onChange={(event, newValue) => {
                setAreasInteresse(newValue);
                }}
                renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
                }
                renderInput={(params) => (
                <TextField
                    {...params}
                    variant="outlined"
                    label="Áreas de Interesse"
                    placeholder="Digite e pressione Enter"
                    margin="normal"
                    helperText="Ex: Cálculo, IA, Programação Web"
                />
                )}
            />

            {/* Campo Upload de Foto */}
            <Button
                variant="outlined"
                component="label" // Faz o botão agir como um <label>
                fullWidth
                margin="normal"
                sx={{ mt: 2, py: 1 }}
            >
                Selecionar Foto de Perfil
                <input
                type="file"
                hidden // O input real fica escondido
                accept="image/*" // Aceita apenas imagens
                onChange={handleFotoChange}
                />
            </Button>
            {nomeArquivoFoto && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Arquivo: {nomeArquivoFoto}
                </Typography>
          )}


            {/* Botão de Envio */}
            <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !role || !nome} // Garante que campos obrigatórios estão preenchidos
                sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
            >
                {loading ? 'Salvando...' : 'Salvar e Continuar'}
            </Button>
            </Box>

      </Paper>
    </Container>
  );
}