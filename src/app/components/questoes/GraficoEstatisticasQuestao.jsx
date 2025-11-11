"use client";

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  Label
} from 'recharts';

import {
  Typography,
  Box
} from '@mui/material';

/**
 * Componente para renderizar os gráficos de estatísticas de uma questão.
 * * Este componente recebe o tipo de questão e os dados, e decide
 * qual gráfico (Barras ou Rosca) deve renderizar.
 * * @param {string} tipoQuestao - 'multipla-escolha' ou 'verdadeiro-falso'
 * @param {Array<object>} dados - Os dados da API (ex: [{ nome: 'A', Respostas: 10, correta: false }, ...])
 */
const GraficoEstatisticasQuestao = ({ tipoQuestao, dados }) => {

  // Lógica para o Gráfico de Barras (Múltipla Escolha)
  const renderGraficoBarras = () => {
    // Define as cores: verde para a correta, vermelho/cinza para as erradas
    const COR_CORRETA = "#2e7d32"; 
    const COR_INCORRETA = "#d32f2f"; 

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const totalRespostas = dados.reduce((sum, entry) => sum + entry.Respostas, 0);
        const valorAtual = payload[0].value;
        const porcentagem = totalRespostas > 0 ? ((valorAtual / totalRespostas) * 100).toFixed(1) : 0;

        return (
          <Box sx={{ p: 1, bgcolor: 'background.paper', border: '1px solid #ccc', borderRadius: '4px' }}>
            <Typography variant="body2" color="text.secondary">{`Alternativa ${label}`}</Typography>
            <Typography variant="body2" color="text.primary">{`Nº de Respostas: ${valorAtual} (${porcentagem}%)`}</Typography>
            {payload[0].payload.correta && (
              <Typography variant="body2" sx={{ color: COR_CORRETA }}>Alternativa Correta</Typography>
            )}
          </Box>
        );
      }
      return null;
    };

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dados} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis 
                dataKey="nome" 
                interval={0}
            />
            <YAxis>
            {/* Adiciona um rótulo ao eixo Y */}
            <Label 
              value="Nº de Respostas" 
              angle={-90} 
              position="insideLeft" 
              style={{ textAnchor: 'middle' }} 
            />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Respostas">
            {dados.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.correta ? COR_CORRETA : COR_INCORRETA} 
              />
            ))}
            </Bar>
        </BarChart>
        
      </ResponsiveContainer>
    );
  };

  // Lógica para o Gráfico de Rosca (Verdadeiro/Falso)
  const renderGraficoRosca = () => {
    const CORES = ['#2e7d32', '#d32f2f']; // [0] = Correto, [1] = Incorreto

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dados}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="Respostas"
            // Exibe "Nome (XX%)" no gráfico
            label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
          >
            {dados.map((entry, index) => (
              // Assume que o primeiro item nos dados é o correto
              <Cell key={`cell-${index}`} fill={entry.correta ? CORES[0] : CORES[1]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Lógica Principal de Renderização
  if (!dados || dados.length === 0) {
    return <Typography>Não há dados de estatística para esta questão.</Typography>;
  }

  // Decide qual gráfico renderizar
  switch (tipoQuestao) {
    case 'multipla-escolha':
      return renderGraficoBarras();
    case 'verdadeiro-falso':
      return renderGraficoRosca();
    default:
      return <Typography>Tipo de questão não suportado para estatísticas.</Typography>;
  }
};


// DADOS MOCKADOS E EXEMPLO DE USO (PARA TESTE DA TASK #225)

// Dados Falsos para Múltipla Escolha
const mockDadosBarra = [
  { nome: 'A', Respostas: 15, correta: false },
  { nome: 'B', Respostas: 45, correta: true },
  { nome: 'C', Respostas: 30, correta: false },
  { nome: 'D', Respostas: 10, correta: false },
];

// Dados Falsos para Verdadeiro/Falso
const mockDadosRosca = [
  { nome: 'Verdadeiro', Respostas: 78, correta: true },
  { nome: 'Falso', Respostas: 22, correta: false },
];


// Componente de Teste Wrapper

export const TesteGraficoEstatisticas = () => {
  return (
    <Box sx={{ width: '100%', p: 4, bgcolor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
        Teste - Gráfico Múltipla Escolha
      </Typography>
      <GraficoEstatisticasQuestao 
        tipoQuestao="multipla-escolha" 
        dados={mockDadosBarra} 
      />
      
      <Box sx={{ my: 4 }} /> 

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
        Teste - Gráfico Verdadeiro/Falso
      </Typography>
      <GraficoEstatisticasQuestao 
        tipoQuestao="verdadeiro-falso" 
        dados={mockDadosRosca} 
      />
      
      <Box sx={{ my: 4 }} /> 

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
        Teste - Sem Dados
      </Typography>
      <GraficoEstatisticasQuestao 
        tipoQuestao="multipla-escolha" 
        dados={[]} 
      />
    </Box>
  );
};

// Exporte o componente real para ser usado na próxima task
export default GraficoEstatisticasQuestao;