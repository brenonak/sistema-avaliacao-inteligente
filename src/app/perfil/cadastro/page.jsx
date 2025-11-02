"use client";

import React, { useState } from 'react'; // 1. IMPORTAR 'useState'
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
  Checkbox 
} from '@mui/material';

export default function PaginaCadastro() {

  // --- Início da Lógica da Task #167 ---
  // Estados para controlar os campos do formulário (UI Pura)
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState(''); // Ex: 'professor' ou 'aluno'
  const [instituicao, setInstituicao] = useState('');
  const [aceiteTermos, setAceiteTermos] = useState(false);

  const [loading, setLoading] = useState(false);

  // Placeholder para a Task #169 (Integrar API)
  // Esta função garante que o formulário é funcional (controlado)
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!aceiteTermos) {
      alert("Você precisa aceitar os termos de uso.");
      return;
    }
    setLoading(true);
    console.log("Task #167: Dados do formulário para envio (simulado):", { nome, papel, instituicao });
    
    // A chamada de API real (Task #169) substituirá este 'setTimeout'
    setTimeout(() => {
      console.log("Simulação de 'Salvo!'");
      setLoading(false);
    }, 1500);
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
          
          {/* Campo Nome Completo */}
          <TextField
            label="Nome Completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            fullWidth
            required
            margin="normal"
            // (Nota: A Task #168 - 'Obter Dados Iniciais' -
            //  vai modificar o valor inicial deste 'useState')
          />

          {/* Campo Papel (Professor/Aluno) */}
          <FormControl fullWidth required margin="normal">
            <InputLabel id="papel-select-label">Seu papel principal</InputLabel>
            <Select
              labelId="papel-select-label"
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              label="Seu papel principal"
            >
              <MenuItem value=""><em>Selecione um papel...</em></MenuItem>
              <MenuItem value="professor">Professor</MenuItem>
              <MenuItem value="aluno">Aluno</MenuItem>
            </Select>
          </FormControl>

          {/* Campo Instituição (Opcional) */}
          <TextField
            label="Instituição de Ensino (Opcional)"
            value={instituicao}
            onChange={(e) => setInstituicao(e.target.value)}
            fullWidth
            margin="normal"
          />

          {/* Campo Aceite de Termos */}
          <FormControlLabel
            control={
              <Checkbox 
                checked={aceiteTermos} 
                onChange={(e) => setAceiteTermos(e.target.checked)} 
                required 
              />
            }
            label="Eu li e aceito os Termos de Uso e a Política de Privacidade."
            sx={{ mt: 2 }}
          />
        {/* Botão de Envio */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !aceiteTermos || !papel || !nome} // Garante que campos obrigatórios estão preenchidos
            sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
          >
            {loading ? 'Salvando...' : 'Salvar e Continuar'}
          </Button>
        </Box>

      </Paper>
    </Container>
  );
}