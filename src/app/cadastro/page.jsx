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
  Checkbox,
  Autocomplete,
  Chip
} from '@mui/material';

export default function PaginaCadastro() {

    // Estados para controlar os campos do formulário
    const [nome, setNome] = useState('');
    const [papel, setPapel] = useState(''); // Ex: 'professor' ou 'aluno'
    const [instituicao, setInstituicao] = useState('');
    const [curso, setCurso] = useState('');
    const [areasInteresse, setAreasInteresse] = useState([]); // Para o Autocomplete
    const [foto, setFoto] = useState(null); // Para o upload
    const [nomeArquivoFoto, setNomeArquivoFoto] = useState("");

    const [loading, setLoading] = useState(false);

    // Handler para a seleção de foto
    const handleFotoChange = (event) => {
        if (event.target.files && event.target.files[0]) {
        const arquivo = event.target.files[0];
        setFoto(arquivo);
        setNomeArquivoFoto(arquivo.name);
        }
    };

    // Placeholder para a Task #169 (Integrar API)
    // Esta função garante que o formulário é funcional (controlado)
    const handleSubmit = (event) => {
        event.preventDefault();
        setLoading(true);

        // Mostra todos os dados coletados no console
        console.log("Task #167: Dados do formulário para envio (simulado):", { 
            nome, 
            papel, 
            instituicao, 
            curso,
            areasInteresse,
            foto // O arquivo em si
        });
        
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
                disabled={loading || !papel || !nome} // Garante que campos obrigatórios estão preenchidos
                sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
            >
                {loading ? 'Salvando...' : 'Salvar e Continuar'}
            </Button>
            </Box>

      </Paper>
    </Container>
  );
}