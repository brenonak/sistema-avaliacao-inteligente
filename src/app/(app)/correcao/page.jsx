"use client";

import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FileItem from "../../components/FileItem";

export default function CorrecaoPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleFileExclude = (fileToRemove) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const handleClearFiles = () => {
    if (loading) return;
    setFiles([]);
  };

  // Iniciar correção
  const handleCorrection = async () => {
    try {
      // Criar FormData com os arquivos
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      // Enviar arquivos para o endpoint
      const response = await fetch('/api/correcao', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar arquivos para correção');
      }

      const data = await response.json();
      console.log('Arquivos enviados com sucesso:', data);
      
      // Limpar arquivos após envio bem-sucedido
      setFiles([]);

      // TODO: Implementar feedback visual do sucesso
      // TODO: Implementar redirecionamento para página de acompanhamento da correção

    } catch (error) {
      console.error('Erro durante o processo de correção:', error);
      // TODO: Implementar feedback visual do erro
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        backgroundColor: "background.default",
      }}
    >
      {/* TÍTULO */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 4,
          fontWeight: "bold",
          color: "text.primary",
          textAlign: "center",
        }}
      >
        Correção Automática
      </Typography>

      {/* BOTÃO DE UPLOAD */}
      <Tooltip
        title="Insira as respostas digitalizadas para realizar a correção automática."
        arrow
        placement="bottom"
      >
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          disabled={loading}
        >
          Adicionar imagem/PDF
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={handleFileChange}
            disabled={loading}
          />
        </Button>
      </Tooltip>

      <Divider sx={{ my: 3, width: "100%", maxWidth: "lg" }} />

      {/* SEÇÃO DE ARQUIVOS ADICIONADOS */}
      <Container maxWidth="md" sx={{ mb: 6 }}>
        {files.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Arquivos adicionados:
            </Typography>

            {files.map((file, index) => (
              <FileItem
                key={`${file.name}-${index}`}
                file={file}
                onExclude={handleFileExclude}
              />
            ))}

            <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
              {/* BOTÃO DE "CORRIGIR" */}
              <Button
                type="button"
                variant="contained"
                color="primary"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                onClick={handleCorrection}
                disabled={loading}
              >
                {loading ? "Corrigindo..." : "Corrigir"}
              </Button>

              {/* BOTÃO DE "LIMPAR" */}
              <Button
                type="button"
                variant="outlined"
                onClick={handleClearFiles}
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    borderColor: "primary.main",
                  },
                }}
                disabled={loading}
              >
                Limpar
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
