"use client";

import React from 'react';
import { Box, Typography, Paper, alpha } from '@mui/material';
import { landingContent } from '../../constants/landingContent';

export default function HowItWorksSection() {

    const { title, steps } = landingContent.howItWorks;

  return (
    <Box 
      component="section"
      id="how-it-works" 
      sx={{ 
        py: { xs: 8, md: 16 }, 

        backgroundColor: 'background.default',
      }}
    >

      <Typography
        variant="h2"
        component="h3"
        sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 6, 
          fontSize: { xs: '2.2rem', md: '3rem' }
        }}
      >
        {title}
      </Typography>

      {/* 4. Container Flexbox para os 3 cards */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }, // Empilha no mobile, lado a lado no desktop
          gap: 4, // Espaçamento entre os cards
        }}
      >
        {steps.map((step) => (
          // 5. Cada card é um <Box> flexível
          <Box
            key={step.id}
            sx={{
              flex: 1, // Faz com que cada card ocupe 1/3 do espaço
              display: 'flex',
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                borderRadius: 3,
                height: '100%', // Garante que todos tenham a mesma altura
                backgroundColor: 'background.default',
                display: 'flex',
                flexDirection: 'column', // Empilha o conteúdo do card
              }}
            >
              {/* 6. O Número ("01", "02", "03") */}
              <Typography
                variant="h1"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: (theme) => alpha(theme.palette.accent.main, 0.2),
                  lineHeight: 1,
                  mb: 2,
                }}
              >
                {step.id}
              </Typography>
              
              {/* 7. O Título e a Descrição do Card */}
              <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {step.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {step.description}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>
    </Box>
  );
}