"use client";

import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Link, Container, darken, alpha} from '@mui/material';
import { landingContent } from '../../constants/landingContent'; 
import NextLink from 'next/link'; // Importe o Link do Next.js

const LandingPageHeader = () => {
  const { logoText, links, buttons } = landingContent.header;

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.75), 
        backdropFilter: 'blur(10px)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* *** LOGO *** */}
          <Button
            component={NextLink} 
            href="/" 
            disableRipple
            sx={{
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              textTransform: 'none', 
              '&:hover': { 
                backgroundColor: 'transparent',
                // 1. EFEITO SALTAR NO LOGO
                transform: 'scale(1.03) translateY(-1px)', 
              },
              // 2. TRANSIÇÃO SUAVE NO LOGO
              transition: (theme) => theme.transitions.create('transform', {
                duration: theme.transitions.duration.short,
              }),
            }}
          >
            {/* O ÍCONE DO LOGO */}
            <Box
              component="img"
              src="/professor.svg" 
              alt="Professor Icon"
              sx={{
                height: 64,
                width: 64,
                mr: 1.5,
              }}
            />
            {/* O TEXTO DO LOGO */}
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ fontWeight: 'bold' }}
            >
              {logoText}
            </Typography>
          </Button>

          {/* Links de Navegação (Escondidos em telas pequenas) */}
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

          {/* Espaçador */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Botões de Ação (Direita) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              component={NextLink}
              href="/dashboard"    
              variant="text"
              color="inherit"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {buttons.login}
            </Button>
            <Button
              component={NextLink} 
              href="/dashboard"   
              variant="contained"
              disableElevation
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: 'accent.dark',
                color: 'white', 
                '&:hover': {
                  backgroundColor: (theme) => darken(theme.palette.accent.dark, 0.15),
                },
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