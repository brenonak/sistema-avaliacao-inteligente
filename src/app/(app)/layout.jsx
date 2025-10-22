"use client"; 
import React from 'react';

// Importando o Header da aplicação (o do professor/aluno)
import Header from '../components/Header'; 

export default function AppLayout({ children }) {
  // Este layout aplica o Header interno e renderiza
  // qualquer página aninhada (dashboard, questoes, etc.)
  return (
    <>
      <Header />
      {children}
    </>
  );
}