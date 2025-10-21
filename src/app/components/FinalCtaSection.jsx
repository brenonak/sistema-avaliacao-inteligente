"use client";

import React from 'react';
import { Box, Typography, Button, darken } from '@mui/material';
import { motion } from 'framer-motion';
import { landingContent } from '../../constants/landingContent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function FinalCtaSection() {

  const { title, subtitle, ctaButton } = landingContent.finalCta;

  return (
    <motion.section
      // ANIMAÇÃO SIMPLES ACIONADA PELO SCROLL
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ 
        paddingTop: '128px', 
        paddingBottom: '128px', 
        backgroundColor: 'var(--mui-palette-background-paper)', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >

      <Box sx={{ maxWidth: 'md', px: 2 }}>
        <Typography
          variant="h2"
          component="h3"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '2rem', md: '2.5rem' }, 
            mb: 2,
          }}
        >
          {title}
        </Typography>


        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ 
            mb: 4,
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.25rem' }
          }} 
        >
          {subtitle}
        </Typography>

        <Button
          variant="contained"
          size="large"
          disableElevation
          endIcon={
            <Box component="span" sx={{ 
                display: 'inline-flex', // Garante alinhamento vertical
                alignItems: 'center',  // Centraliza o ícone
                transition: 'transform 0.2s ease' // Mantém a animação
            }}>
              <ArrowForwardIcon fontSize="inherit" /> {/* Adapta o tamanho do ícone */}
            </Box>
          }
          sx={{ 
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            backgroundColor: 'accent.dark',
            color: 'white', 
            
            // 2. MAIS ARREDONDADO
            borderRadius: '24px', 
            
            // 3. TRANSIÇÃO SUAVE (incluindo a transição do ícone)
            transition: (theme) => theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
              duration: theme.transitions.duration.short,
            }),
            
            '&:hover': {
              backgroundColor: (theme) => darken(theme.palette.accent.dark, 0.15),
              // 4. EFEITO "SALTAR"
              transform: 'scale(1.05) translateY(-2px)',
              boxShadow: (theme) => theme.shadows[4],
              
              // 5. ANIMAÇÃO DA SETA (move o span que contém o ícone)
              '& .MuiButton-endIcon > span': { // Seleciona o <span> dentro do endIcon
                transform: 'translateX(4px)', // Move 4px para a direita
              },
            },
          }}
        >
          {ctaButton}
        </Button>
      </Box>
    </motion.section>
  );
}