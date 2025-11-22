"use client";

import React from 'react';
import { BarChart } from '@mui/x-charts';
import { Box } from '@mui/material';

const BarChartAgrupado = ({ dados }) => {
  
  const COR_CORRETA = "#2e7d32";
  const COR_INCORRETA = "#d32f2f";

  const valueFormatter = (value) => value === null ? '' : `${value}%`;

  return (
        <Box sx={{
          width: '100%',
          maxWidth: '600px',
          mx: 'auto'
        }}>
          <BarChart
            dataset={dados} // Usará os mockDadosVFAgrupado
            xAxis={[{
              scaleType: 'band',
              dataKey: 'nome', // Eixo X (Afirmação I, II, III...)
              label: 'Afirmação'
            }]}
            yAxis={[{
              label: 'Percentual de Respostas (%)',
              max: 100
            }]}
            series={[
              {
                dataKey: 'acertos',
                label: 'Acertos',
                valueFormatter,
              },
              {
                dataKey: 'erros',
                label: 'Erros',
                valueFormatter,
              }
            ]}
            colors={[COR_CORRETA, COR_INCORRETA]}
            height={300}
            margin={{ top: 40, right: 20, left: 60, bottom: 30 }} // Espaço para a legenda no topo
  
            slotProps={{
              legend: { hidden: true },
            }}
          />
        </Box>
      );
    };

export default BarChartAgrupado;