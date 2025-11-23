"use client";

import React from 'react';
import { BarChart } from '@mui/x-charts';
import { Box } from '@mui/material';
import { CHART_COLORS } from '../../../../constants/chartColors';

const BarChartFrequencia = ({ dados, labelEixoX = 'Alternativa' }) => {
  
  // Cores internas do componente
  const COR_CORRETA = "#2e7d32";
  const COR_INCORRETA = "#d32f2f";

  const dadosProcessados = dados.map(entry => ({
    nome: entry.nome,
    RespostasCorretas: entry.correta ? entry.Respostas : undefined,
    RespostasIncorretas: !entry.correta ? entry.Respostas : undefined,
  }));

  const totalRespostas = dados.reduce((sum, entry) => sum + entry.Respostas, 0);
  
  const valueFormatter = (value) => {
    if (value === null || value === undefined) return null;
    const porcentagem = totalRespostas > 0 ? ((value / totalRespostas) * 100).toFixed(1) : 0;
    return `Nº de Respostas: ${value} (${porcentagem}%)`;
  };

  return (
        // Envolve o BarChart numa Box para centralização
        <Box sx={{
          width: '100%',
          maxWidth: '600px',
          mx: 'auto'
        }}>
          <BarChart
            dataset={dadosProcessados}
            xAxis={[{
              scaleType: 'band',
              dataKey: 'nome', // Eixo X usa a chave 'nome' (A, B, C, D)
              label: labelEixoX
            }]}
            yAxis={[{
              label: 'Nº de Respostas' // Rótulo do Eixo Y
            }]}
            series={[
              {
                dataKey: 'RespostasCorretas',
                valueFormatter,
                stack: 'respostas' // Identificador do "stack"
              },
              {
                dataKey: 'RespostasIncorretas',
                valueFormatter,
                stack: 'respostas' // Mesmo identificador
              }
            ]}
            colors={[CHART_COLORS.CORRECT, CHART_COLORS.INCORRECT]}
            height={300}
            margin={{ top: 20, right: 20, left: 50, bottom: 20 }}
            slotProps={{
              legend: { hidden: true },
            }}
            tooltip={{ trigger: 'item' }}
          />
        </Box>
      );
    };

export default BarChartFrequencia;