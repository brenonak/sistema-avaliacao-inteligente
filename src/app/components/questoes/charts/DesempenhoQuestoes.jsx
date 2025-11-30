"use client";

import React from 'react';
import { BarChart } from '@mui/x-charts';
import { Box } from '@mui/material';
import { CHART_COLORS } from '@/constants/chartColors'; // Supondo que criou na task anterior

const DesempenhoQuestoes = ({ dados }) => {
  
  // Limiar de corte (Ex: abaixo de 50% de acerto é crítico)
  const THRESHOLD = 50; 

  // Preparar os dados dividindo em duas séries para coloração condicional
  // Se acerto >= 50, vai para a série "Bom", senão vai para "Atenção"
  const seriesBom = [];
  const seriesAtencao = [];
  const labels = [];

  dados.forEach(item => {
    labels.push(item.nome); // Q1, Q2...
    
    // O valor no mock é 'Respostas' (que representa %)
    const valor = item.Respostas; 

    if (valor >= THRESHOLD) {
      seriesBom.push(valor);
      seriesAtencao.push(null); // Deixa vazio na outra série
    } else {
      seriesBom.push(null); // Deixa vazio nesta
      seriesAtencao.push(valor);
    }
  });

  const valueFormatter = (value) => value === null ? '' : `${value}% de acerto`;

  return (
    <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
      <BarChart
        xAxis={[{ 
          scaleType: 'band', 
          data: labels,
          label: 'Questões da Prova' 
        }]}
        yAxis={[{ 
          label: 'Taxa de Acerto (%)', 
          max: 100 
        }]}
        series={[
          { 
            data: seriesBom, 
            label: 'Bom Desempenho', 
            color: '#1976d2', // Azul (ou CHART_COLORS.CORRECT)
            stack: 'total',
            valueFormatter
          },
          { 
            data: seriesAtencao, 
            label: 'Requer Atenção', 
            color: CHART_COLORS.INCORRECT || '#d32f2f', // Vermelho
            stack: 'total',
            valueFormatter
          }
        ]}
        height={350}
        margin={{ top: 20, right: 20, left: 50, bottom: 40 }}
        // Oculta a legenda para ficar mais limpo, ou deixa para explicar as cores
        slotProps={{
          legend: { position: { vertical: 'top', horizontal: 'middle' } }, 
        }}
      />
    </Box>
  );
};

export default DesempenhoQuestoes;