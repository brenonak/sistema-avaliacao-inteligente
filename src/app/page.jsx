import React from 'react';
import Box from '@mui/material/Box';
import { Container } from '@mui/material';

import LandingPageHeader from './components/LandingPageHeader'; 
// import Footer from './components/Footer'; // Ainda não criado

import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import FinalCtaSection from './components/FinalCtaSection';


export const metadata = {
  title: "Plataforma Inteligente para Atividades Acadêmicas",
  description: "Otimize seu tempo e eleve a qualidade das suas avaliações com o poder da Inteligência Artificial.",
};

export default function LandingPage() {
  return (
    <Box component="main" sx={{ display: 'flex', flexDirection: 'column' }}>
      <LandingPageHeader />

      <Container maxWidth="lg">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FinalCtaSection />
      </Container>

      {/* <Footer /> */}
    </Box>
  );
}