"use client";

import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import Link from 'next/link';

export default function Logo({ href, src, label, sx = [] }) {
  return (
    <Button
      component={Link}
      href={href}
      disableRipple
      sx={[
        {
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'transparent',
            transform: 'scale(1.03) translateY(-1px)', // Efeito sutil de "pulo"
          },
          transition: (theme) => theme.transitions.create('transform', {
            duration: theme.transitions.duration.short,
          }),
        },
        // Permite passar estilos extras via prop sx se necessário
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="img"
        src={src}
        alt={`${label} Logo`}
        sx={{ height: 64, width: 64, mr: 1.5 }}
      />
      <Typography 
        variant="h6" 
        component="div" 
        sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
    </Button>
  );
}