"use client";

import React from 'react';
import { Box, Typography, Button, darken } from '@mui/material';
import { motion } from 'framer-motion';
import { landingContent } from '../../constants/landingContent';
import Image from 'next/image';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NextLink from 'next/link';

export default function HeroSection() {
  const { titlePrefix, titleHighlight, subtitle, ctaButton } = landingContent.hero;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}   
      transition={{ duration: 0.6, ease: "easeOut" }} 
    >

      <Box 
        component="section" 
        id="hero"          
        sx={{ py: { xs: 8, md: 16 } }}
      >

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: 'center', 
            gap: { xs: 6, md: 8 }, 
          }}
        >
        
        {/* === Coluna da Esquerda (Texto) === */}
        <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
          
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 'bold',
              lineHeight: 1.25,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' }, 
              mb: 2,
            }}
          >
            {titlePrefix}
            <Box 
              component="span" 
              sx={{ 
                color: (theme) => darken(theme.palette.accent.main, 0.1) 
              }}
            >
              {titleHighlight}
            </Box>
          </Typography>
          
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, fontWeight: 400 }}
          >
            {subtitle}
          </Typography>
          
          <Button
            component={NextLink} 
            href="/login" 
            variant="contained"
            size="large"
            disableElevation
            endIcon={
              <Box component="span" sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center',  
                  transition: 'transform 0.2s ease' 
              }}>
                <ArrowForwardIcon fontSize="inherit" />
              </Box>
            }
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              backgroundColor: 'accent.dark',
              color: 'white', 
              
              // 1. MAIS ARREDONDADO
              borderRadius: '24px', 
              
              // 2. TRANSIÇÃO SUAVE
              transition: (theme) => theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
                duration: theme.transitions.duration.short,
              }),
              
              '&:hover': {
                backgroundColor: (theme) => darken(theme.palette.accent.dark, 0.15),
                // 3. EFEITO "SALTAR"
                transform: 'scale(1.05) translateY(-2px)', 
                boxShadow: (theme) => theme.shadows[4], 
                
                '& .MuiButton-endIcon > span': { 
                  transform: 'translateX(4px)',
                },
              },
            }}
          >
            {ctaButton}
          </Button>
        </Box>

        {/* === Coluna da Direita (Imagem) === */}
        <Box sx={{ flex: 1, width: '100%' }}>
          

          <Box
            sx={{
              position: 'relative', 
              width: '100%',

            }}
          >
            <Image
              src="/LandingPageImage.png" 
              alt="Dashboard da Plataforma Inteligente"
              
              width={900} 
              height={900}

              style={{
                width: '100%',   
                height: 'auto',  
                
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                
              }}
              priority
            />
          </Box>
          </Box>
        </Box> 
      </Box>
    </motion.section>
  );
}