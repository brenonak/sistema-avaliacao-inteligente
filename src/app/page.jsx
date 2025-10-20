// ARQUIVO ATUALIZADO: src/app/page.jsx

import React from 'react';
import Box from '@mui/material/Box';

// Importando os componentes (que ainda vamos criar)
// import Header from '../components/Header'; // <-- Manteremos comentado por enquanto
// import Footer from '../components/Footer'; // <-- Manteremos comentado por enquanto
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import FinalCtaSection from './components/FinalCtaSection';


export const metadata = {
  title: "Plataforma Inteligente para Atividades Acadêmicas",
  description: "Otimize seu tempo e eleve a qualidade das suas avaliações com o poder da Inteligência Artificial.",
};

// Parte 2 da Task #117: Estruturar a página
export default function LandingPage() {
  return (
    <Box component="main" sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* <Header /> */}

      
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FinalCtaSection />

      {/* <Footer /> */}
    </Box>
  );
}