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

  // Iniciar correção (ainda não implementada)
  const handleCorrection = async () => {
    // validação básica
    if (files.length === 0) {
      setError("Adicione pelo menos um arquivo para iniciar a correção.");
      return;
    }

    setLoading(true);

    try {
      // Simulação de requisição assíncrona -> substituir por chamada real à API quando disponível
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Exemplo de como enviar files para backend (descomente e ajuste a rota quando implementar)
      // const formData = new FormData();
      // files.forEach((f) => formData.append("files", f));
      // const res = await fetch("/api/correcao", { method: "POST", body: formData });
      // if (!res.ok) throw new Error("Falha ao iniciar correção");

      console.log("Correção feita com sucesso");
    } catch (err) {
      console.error("Erro ao efetuar a correção:", err);
    } finally {
      setLoading(false);
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
