"use client"; 

import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Link, Container } from '@mui/material';

import { landingContent } from '../../constants/landingContent'; 

const LandingPageHeader = () => {
  const { logoText, links, buttons } = landingContent.header;

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backgroundColor: (theme) => 
          theme.palette.header?.main || theme.palette.background.paper,
        backdropFilter: 'blur(10px)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo e Links de Navegação (Esquerda) */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {logoText}
            </Typography>
            
            <Box sx={{ ml: 4, display: { xs: 'none', md: 'flex' }, gap: 3 }}>
              {links.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  variant="body1"
                  underline="none"
                  color="text.primary"
                  sx={{
                    fontWeight: 500,
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {link.title}
                </Link>
              ))}
            </Box>
          </Box>

          {/* Espaçador */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Botões de Ação (Direita) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="text"
              color="inherit"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {buttons.login}
            </Button>
            <Button
              variant="contained"
              color="primary"
              disableElevation
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {buttons.signup}
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default LandingPageHeader;