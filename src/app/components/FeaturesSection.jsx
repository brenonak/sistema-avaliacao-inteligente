// ATUALIZADO (COM A CORREÇÃO DO GRID): src/app/components/FeaturesSection.jsx

"use client";

import React from 'react';
import { Box, Typography, Grid, Paper, Avatar } from '@mui/material';
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
  // Estamos usando o 'title' e 'cards' do SEU landingContent.js
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
        {/* O título vem do seu landingContent.js */}
        {title}
      </Typography>

      <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
        {cards.map((card) => {
          const IconComponent = iconMap[card.title] || AutoAwesomeIcon; 
          
          return (
            // ******** A CORREÇÃO ESTÁ AQUI ********
            // Adicionando a prop "item" para a sintaxe do Grid v1
            <Grid item xs={12} md={6} key={card.title}>
              
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
                
                {/* O título e a descrição vêm do seu landingContent.js */}
                <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {card.description}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}