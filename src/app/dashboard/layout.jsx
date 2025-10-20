
import React from 'react';
import Header from '../components/Header'; // Importando o Header de volta
import Box from '@mui/material/Box';

export default function DashboardLayout({ children }) {
  return (
    <Box>
      <Header />
      
      {/* O "children" aqui será a sua página (src/app/dashboard/page.jsx) */}
      <main>
        {children}
      </main>
    </Box>
  );
}