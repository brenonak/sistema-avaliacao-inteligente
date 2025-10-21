"use client";

import React from 'react';
import { Box, Typography, Button, darken } from '@mui/material';
import { landingContent } from '../../constants/landingContent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function FinalCtaSection() {

  const { title, subtitle, ctaButton } = landingContent.finalCta;

  return (
    <Box 
      component="section" 
      sx={{ 
        py: { xs: 8, md: 16 }, 
        backgroundColor: 'background.paper', 
        textAlign: 'center',

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >

      <Box sx={{ maxWidth: 'md', px: 2 }}>
        <Typography
          variant="h2"
          component="h3"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '2rem', md: '2.5rem' }, 
            mb: 2,
          }}
        >
          {title}
        </Typography>


        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ 
            mb: 4,
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.25rem' }
          }} 
        >
          {subtitle}
        </Typography>

        <Button
          variant="contained"
          size="large"
          disableElevation
          endIcon={<ArrowForwardIcon />}
          sx={{ 
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            backgroundColor: 'accent.dark',
            color: 'white', 
            '&:hover': {
              backgroundColor: (theme) => darken(theme.palette.accent.dark, 0.15),
            },
          }}
        >
          {ctaButton}
        </Button>
      </Box>
    </Box>
  );
}