"use client"; 
import React from 'react';

// Importando o Overlay da aplicação (o do professor/aluno)
import Overlay from "../components/Overlay";

export default function AppLayout({ children }) {
  // Este layout aplica o Overlay interno e renderiza
  // qualquer página aninhada (dashboard, questoes, etc.)
  return (
    <Overlay content={children}/>
  );
}