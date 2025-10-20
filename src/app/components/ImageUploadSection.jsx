import React, { useState } from "react";
import {
  Button,
  Popover,
  Box,
  Typography,
  Stack,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";

function ImageUploadSection({ handleFileChange }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenPopover = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "frequent-images-popover" : undefined;

  const frequentImages = [
    "/blue_bg.jpg",
    "/blue_bg.jpg",
    "/blue_bg.jpg",
  ];

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

      {/* POP-UP (POPOVER) */}
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
          sx: { p: 2, width: 250 },
        }}
      >
        <Typography variant="h6" mb={1}>
          Imagens frequentes
        </Typography>

        <Stack spacing={1}>
          {frequentImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`imagem-${index}`}
              style={{
                width: "100%",
                borderRadius: 8,
                cursor: "pointer",
              }}
              onClick={() => {
                handleClosePopover();
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = 0.8)}
              onMouseOut={(e) => (e.currentTarget.style.opacity = 1)}
            />
          ))}
        </Stack>
      </Popover>
    </Stack>
  );
}

export default ImageUploadSection;