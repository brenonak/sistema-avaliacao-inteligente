import React, { useState } from "react";
import {
  Button,
  Popover,
  Box,
  Typography,
  Stack,
  Grid
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import { useTheme } from "@mui/material/styles";

function ImageUploadSection({ handleFileChange }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenPopover = (event) => {
    setAnchorEl(event.currentTarget);
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

  const frequentImages = [
    { id: 1, src: "/blue_bg.jpg", name: "teste1.jpg" },
    { id: 2, src: "/blue_bg.jpg", name: "teste2.jpg" },
    { id: 3, src: "/blue_bg.jpg", name: "teste3.jpg" },
  ];


  const theme = useTheme();

  const fetchImageAsFile = async (url, name) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], name, { type: blob.type });
  };


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
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: { p: 2, width: 300 },
        }}
      >
        <Typography variant="h6" mb={1}>
          Imagens frequentes
        </Typography>

        <Box sx={{ overflowY: "auto", maxHeight: 220 }}>
          <Grid container>
            {frequentImages.map((img) => {
              const isSelected = selectedImages.includes(img.id);

              return (
                <Grid item size={6} pr={1} pb={1} key={img.id}>
                  <img
                    src={img.src}
                    alt={`imagem-${img.id}`}
                    onClick={() => handleImageClick(img)}
                    style={{
                      width: 128,
                      height: 128,
                      borderRadius: 4,
                      cursor: "pointer",
                      border: isSelected
                        ? `3px solid ${theme.palette.accent.main}`
                        : "2px solid transparent",
                      opacity: isSelected ? 0.8 : 1,
                      boxSizing: "border-box",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = 0.8)}
                    onMouseOut={(e) => {
                      if (!isSelected) e.currentTarget.style.opacity = 1;
                    }}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Box mt={2} textAlign="right">
          <Button
            variant="contained"
            size="small"
            disabled={selectedImages.length === 0}
            onClick={async () => {
              try {
                const selectedImageFiles = selectedImages.map((id) =>
                  frequentImages.find((img) => img.id === id)
                );
                const files = await Promise.all(
                  selectedImageFiles.map((img) =>
                    fetchImageAsFile(img.src, img.name)
                  )
                );
                handleFileChange(files);
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
      </Popover>
    </Stack>
  );
}

export default ImageUploadSection;