"use client";

import React from 'react';
import { Box, Typography, Paper, Avatar, Container } from '@mui/material';
import { motion } from 'framer-motion';
import { landingContent } from '../../constants/landingContent';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DnsIcon from '@mui/icons-material/Dns';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const iconMap = {
  "Geração de Conteúdo com IA": AutoAwesomeIcon,
  "Banco de Questões Centralizado": DnsIcon,
  "Exportação Flexível": FileDownloadIcon, 
  "Análise de Desempenho": BarChartIcon,
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function FeaturesSection() {
  const { title, cards } = landingContent.features;

  return (
    <motion.section
      // ANIMAÇÃO ACIONADA PELO SCROLL
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, amount: 0.2 }} 
      transition={{ staggerChildren: 0.15 }} 
      id="FeaturesSection"
      style={{ 
        paddingTop: '128px', 
        paddingBottom: '128px', 
        backgroundColor: 'var(--mui-palette-background-paper)',
        borderTop: '1px solid var(--mui-palette-divider)',
        borderBottom: '1px solid var(--mui-palette-divider)',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          component="h3"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 4,
            fontSize: { xs: '2.2rem', md: '3rem' }
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          {cards.map((card) => {

            const IconComponent = iconMap[card.title] || AutoAwesomeIcon; 
            
            return (
              <Box
                key={card.title}
                sx={{
                  flexBasis: { xs: '100%', md: 'calc(50% - 16px)' }, 
                  flexGrow: 1,
                  // Adicionamos display: flex aqui para o Paper preencher
                  display: 'flex', 
                }}
              >
                <motion.div 
                  variants={cardVariants} 
                  style={{ width: '100%', display: 'flex' }} // Garante que preencha o Box pai
                >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    height: '100%',
                    backgroundColor: 'background.default',
                    // Adiciona transição suave para as propriedades transform e boxShadow
                    transition: (theme) => theme.transitions.create(['transform', 'box-shadow'], {
                      duration: theme.transitions.duration.short, 
                    }),
                    // Estilos aplicados QUANDO o mouse está sobre o Paper
                    '&:hover': {
                      transform: 'scale(1.03) translateY(-4px)', // Aumenta 3% e sobe 4px
                      boxShadow: (theme) => theme.shadows[6], // Usa uma sombra mais forte do tema
                    },
                  }}
                >
                  {/* ADICIONANDO EFEITO AO ÍCONE (AVATAR) */}
                  <Avatar
                    sx={{
                      bgcolor: (theme) => `${theme.palette.accent.main}1A`,
                      color: 'accent.main', 
                      mb: 2,
                      width: 56,
                      height: 56,
                      // Adiciona transição suave APENAS para transform
                      transition: (theme) => theme.transitions.create('transform', {
                        duration: theme.transitions.duration.short,
                      }),
                      // Quando o MOUSE está sobre o PAPER PAI...
                      '.MuiPaper-root:hover &': { 
                        transform: 'translateY(-2px) scale(1.05)', // Sobe um pouco menos que o card e aumenta levemente
                      },
                    }}
                  >
                    <IconComponent fontSize="medium" />
                  </Avatar>
                  
                  <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {card.description}
                  </Typography>
                </Paper>
                </motion.div> 
              </Box>
            );
          })}
        </Box>
      </Container> 
    </motion.section>
  );
}