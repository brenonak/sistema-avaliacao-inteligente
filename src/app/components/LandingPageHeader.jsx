"use client";

import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Link, Container, darken, alpha} from '@mui/material';
import { landingContent } from '../../constants/landingContent'; 
import NextLink from 'next/link';
import Logo from './Logo';

const LandingPageHeader = () => {
  const { logoText, links, buttons } = landingContent.header;

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backgroundColor: 'var(--mui-palette-header-main)',
        backdropFilter: 'blur(10px)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* *** LOGO *** */}
          <Logo 
            href="/" 
            src="/professor.svg"
            label={logoText} 
          />

          {/* *** LINKS DE NAVEGAÇÃO *** */}
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
                  // 3. EFEITO HOVER NOS LINKS
                  transition: 'color 0.2s ease', // Transição suave da cor
                  '&:hover': {
                    color: 'accent.main', // Muda para o azul médio no hover
                  },
                }}
              >
                {link.title}
              </Link>
            ))}
          </Box>

          {/* Espaçador */}
          <Box sx={{ flexGrow: 1 }} />

          {/* *** BOTÕES DE AÇÃO *** */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            
            <Button
              component={NextLink} 
              href="/login"    
              variant="contained"
              disableElevation
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: 'accent.dark',
                color: 'white', 
                '&:hover': {
                  backgroundColor: 'accent.main',
                },
                // ARREDONDAMENTO NO BOTÃO "CRIAR CONTA"
                borderRadius: '24px', 
              }}
            >
              {buttons.login}
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default LandingPageHeader;