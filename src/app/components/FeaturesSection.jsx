"use client";

import React from 'react';
import { Box, Typography, Paper, Avatar } from '@mui/material';
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