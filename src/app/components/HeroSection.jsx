// ATUALIZADO (CORREÇÃO FINAL DA IMAGEM INTEIRA): src/app/components/HeroSection.jsx

"use client";

import React from 'react';
import { Box, Typography, Button, darken } from '@mui/material';
import { landingContent } from '../../constants/landingContent';
import Image from 'next/image';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function HeroSection() {
  const { titlePrefix, titleHighlight, subtitle, ctaButton } = landingContent.hero;

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 16 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center', // Isso vai centralizar verticalmente o texto com a imagem (que é alta)
          gap: { xs: 6, md: 8 }, // Aumenta o espaço entre eles
        }}
      >
        
        {/* === Coluna da Esquerda (Texto) === */}
        {/* Usamos flex: 1 para ocupar metade do espaço */}
        <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
          
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 'bold',
              lineHeight: 1.25,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' }, 
              mb: 2,
            }}
          >
            {titlePrefix}
            <Box 
              component="span" 
              sx={{ 
                color: (theme) => darken(theme.palette.accent.main, 0.1) 
              }}
            >
              {titleHighlight}
            </Box>
          </Typography>
          
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, fontWeight: 400 }}
          >
            {subtitle}
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            disableElevation
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              backgroundColor: (theme) => darken(theme.palette.accent.main, 0.3),
              color: 'white', 
              '&:hover': {
                backgroundColor: (theme) => darken(theme.palette.accent.main, 0.45),
              },
            }}
          >
            {ctaButton}
          </Button>
        </Box>

        {/* === Coluna da Direita (Imagem) === */}
        {/* Usamos flex: 1 para ocupar a outra metade */}
        <Box sx={{ flex: 1, width: '100%' }}>
          
          {/* 1. Este Box externo SÓ precisa de 'position: relative' */}
          <Box
            sx={{
              position: 'relative', 
              width: '100%',
              // A ALTURA FIXA FOI REMOVIDA DAQUI
            }}
          >
            {/* 2. O <Image> agora controla todo o estilo visual */}
            <Image
              src="/LandingPageImage.png" // Usando o nome do arquivo que você mandou
              alt="Dashboard da Plataforma Inteligente"
              
              // Use a proporção real (a imagem é 900x900)
              width={900} 
              height={900}

              style={{
                width: '100%',   // Fará a imagem ser responsiva
                height: 'auto',  // ESSA É A CORREÇÃO: A altura se ajusta à largura
                
                // Estilos do v0
                borderRadius: '16px', // Um bom arredondamento
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                
                // Não precisamos mais de objectFit ou objectPosition
              }}
              priority
            />
          </Box>
        </Box>

      </Box>
    </Box>
  );
}