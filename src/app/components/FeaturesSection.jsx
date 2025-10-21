// ATUALIZADO (FINAL, COM FLEXBOX): src/app/components/FeaturesSection.jsx

"use client";

import React from 'react';
// 1. Removido 'Grid' dos imports
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { landingContent } from '../../constants/landingContent';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DnsIcon from '@mui/icons-material/Dns';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileCopyIcon from '@mui/icons-material/FileCopy';

const iconMap = {
  "Geração de Conteúdo com IA": AutoAwesomeIcon,
  "Banco de Questões Centralizado": DnsIcon,
  "Exportação Profissional": FileCopyIcon,
  "Análise de Desempenho": BarChartIcon,
};

export default function FeaturesSection() {
  const { title, cards } = landingContent.features;

  return (
    <Box 
      component="section" 
      sx={{ 
        py: { xs: 8, md: 16 }, 
        backgroundColor: 'background.paper',
        borderTop: 1, 
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
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

      {/* 2. Substituímos <Grid container> por <Box display="flex"> */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap', // Permite que os itens quebrem para a próxima linha
          gap: 4, // Espaçamento entre os cards (vertical e horizontal)
        }}
      >
        {cards.map((card) => {
          const IconComponent = iconMap[card.title] || AutoAwesomeIcon; 
          
          return (
            // 3. Cada card é agora um <Box> flexível
            <Box
              key={card.title}
              sx={{
                // Em telas pequenas (xs), ocupa 100% da largura
                flexBasis: { xs: '100%', md: 'calc(50% - 16px)' }, 
                // Em telas médias (md), ocupa 50% menos metade do 'gap'
                // (16px é metade de 'gap: 4', que é 32px)
                flexGrow: 1,
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  borderRadius: 3,
                  height: '100%',
                  backgroundColor: 'background.default',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: (theme) => `${theme.palette.accent.main}1A`,
                    color: 'accent.main', 
                    mb: 2,
                    width: 56,
                    height: 56,
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
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}