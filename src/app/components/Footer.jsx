import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';
import { landingContent } from '../../constants/landingContent';

export default function Footer() {
  const { copyright, links } = landingContent.footer;

  return (
    <Box 
      component="footer" 
      sx={{
        py: 4, 
        backgroundColor: 'background.default', 
        borderTop: 1, 
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box 
          sx={{
            display: 'flex',
            // No mobile (xs) empilha, no desktop (md) fica lado a lado
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2, // Espaçamento (útil no mobile)
          }}
        >
          {/* Copyright (Esquerda) */}
          <Typography variant="body2" color="text.secondary">
            {copyright}
          </Typography>

          {/* Links (Direita) */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            {links.map((link) => (
              <Link 
                key={link.title} 
                href={link.href} 
                variant="body2" 
                underline="none" 
                color="text.secondary"
                sx={{ '&:hover': { color: 'text.primary' } }}
              >
                {link.title}
              </Link>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}