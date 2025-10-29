"use client";

import React from 'react';
import { Box, Typography, Paper, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { landingContent } from '../../constants/landingContent';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function HowItWorksSection() {

    const { title, steps } = landingContent.howItWorks;

  return (
    <motion.section
      // ANIMAÇÃO ACIONADA PELO SCROLL COM STAGGER
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: false, amount: 0.2 }} 
      transition={{ staggerChildren: 0.15 }}
      id="how-it-works"
      style={{ 
        paddingTop: '128px', 
        paddingBottom: '128px', 
        backgroundColor: 'var(--mui-palette-background-default)',
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

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }, // Empilha no mobile, lado a lado no desktop
          gap: 4, // Espaçamento entre os cards
        }}
      >
        {steps.map((step) => (
          <motion.div 
            key={step.id} 
            variants={cardVariants}
            style={{ 
              flex: 1, 
              display: 'flex', 
            }} 
          >
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                borderRadius: 3,
                height: '100%',
                backgroundColor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
                // Adiciona transição suave
                transition: (theme) => theme.transitions.create(['transform', 'box-shadow'], {
                  duration: theme.transitions.duration.short,
                }),
                // Estilos aplicados QUANDO o mouse está sobre o Paper
                '&:hover': {
                  transform: 'scale(1.03) translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[6],
                },
              }}
            >
              {/* O Número ("01", "02", "03") */}
              <Typography
                variant="h1"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: (theme) => alpha(theme.palette.accent.main, 0.6),
                  lineHeight: 1,
                  mb: 2,
                }}
              >
                {step.id}
              </Typography>
              
              {/* O Título e a Descrição do Card */}
              <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {step.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {step.description}
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>
    </motion.section>
  );
}