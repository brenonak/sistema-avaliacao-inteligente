import React, { useState, useEffect } from "react";
import {
  Button,
  Popover,
  Box,
  Typography,
  Stack,
  Grid,
  CircularProgress,
  Alert
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import { useTheme } from "@mui/material/styles";

function ImageUploadSection({ handleFileChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [frequentImages, setFrequentImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenPopover = async (event) => {
    setAnchorEl(event.currentTarget);
    
    // Carregar as imagens frequentes do banco
    if (frequentImages.length === 0) {
      await loadFrequentImages();
    }
  };

  const loadFrequentImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar todas as imagens disponíveis (limite de 100)
      const response = await fetch('/api/recursos?limit=100');
      const data = await response.json();
      
      console.log('[ImageUploadSection] Recursos recebidos:', data);
      
      if (data.items && Array.isArray(data.items)) {
        // Filtrar apenas imagens
        const images = data.items
          .filter(item => {
            const isImage = item.mime && item.mime.startsWith('image/');
            if (!isImage) {
              console.log('[ImageUploadSection] Item não é imagem:', item);
            }
            return isImage;
          })
          .map(item => ({
            id: item.id,
            src: item.url,
            name: item.filename,
            refCount: item.usage?.refCount || 0
          }));
        
        console.log('[ImageUploadSection] Total de imagens filtradas:', images.length);
        setFrequentImages(images);
      } else {
        console.log('[ImageUploadSection] Nenhum item encontrado nos dados');
        setFrequentImages([]);
      }
    } catch (err) {
      console.error('Erro ao carregar imagens frequentes:', err);
      setError('Erro ao carregar imagens frequentes');
      setFrequentImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedImages([]);
  };

  const [selectedImages, setSelectedImages] = useState([]);

  const handleImageClick = (img) => {
    setSelectedImages((prev) =>
      prev.includes(img.id)
        ? prev.filter((id) => id !== img.id)
        : [...prev, img.id]
    );
  };

  const open = Boolean(anchorEl);
  const id = open ? "frequent-images-popover" : undefined;

  const theme = useTheme();

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {/* BOTÃO DE 'ADICIONAR IMAGEM' */}
      <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
      >
        Adicionar imagem
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileChange}
        />
      </Button>

      {/* BOTÃO DE 'IMAGENS FREQUENTES' */}
      <Button
        variant="outlined"
        startIcon={<ImageIcon />}
        onClick={handleOpenPopover}
      >
        Imagens frequentes
      </Button>

      {/* POP-UP DAS IMAGENS FREQUENTES */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: { p: 2, width: 600, maxHeight: 600 },
        }}
      >
        <Typography variant="h6" mb={1}>
          Imagens Frequentes ({frequentImages.length} disponíveis)
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && frequentImages.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
            Nenhuma imagem disponível no banco
          </Typography>
        )}

        {!loading && !error && frequentImages.length > 0 && (
          <Box sx={{ overflowY: "auto", maxHeight: 480 }}>
            <Grid container spacing={1}>
              {frequentImages.map((img) => {
                const isSelected = selectedImages.includes(img.id);

                return (
                  <Grid item xs={4} key={img.id}>
                    <Box
                      onClick={() => handleImageClick(img)}
                      sx={{
                        position: 'relative',
                        cursor: 'pointer',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: isSelected
                          ? `3px solid ${theme.palette.accent.main}`
                          : "2px solid transparent",
                        transition: 'all 0.2s',
                        '&:hover': {
                          opacity: 0.8,
                          transform: 'scale(0.98)'
                        }
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.name}
                        style={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          p: 0.5,
                          fontSize: '0.75rem'
                        }}
                      >
                        <Typography variant="caption" noWrap display="block">
                          {img.name}
                        </Typography>
                        <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                          Usado {img.refCount}x
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {selectedImages.length} imagem(ns) selecionada(s)
          </Typography>
          <Box>
            <Button
              size="small"
              onClick={handleClosePopover}
              sx={{ mr: 1 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={selectedImages.length === 0}
              onClick={async () => {
                try {
                  // Em vez de converter para File, passar os recursos existentes diretamente
                  const selectedResources = selectedImages.map((id) =>
                    frequentImages.find((img) => img.id === id)
                  ).map(img => ({
                    id: img.id,
                    url: img.src,
                    name: img.name
                  }));
                  
                  console.log('[ImageUploadSection] Recursos existentes selecionados:', selectedResources);
                  
                  // NÃO incrementar aqui - será incrementado automaticamente ao salvar a questão
                  // O incremento acontece em POST /api/questoes quando a questão é criada
                  
                  // Passar como segundo parâmetro para indicar que são recursos existentes
                  handleFileChange(null, selectedResources);
                } catch (error) {
                  console.error("Erro ao processar imagens frequentes:", error);
                } finally {
                  handleClosePopover();
                }
              }}
            >
              Adicionar
            </Button>
          </Box>
        </Box>
      </Popover>
    </Stack>
  );
}

export default ImageUploadSection;