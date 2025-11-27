"use client";

import React from 'react';
import { BarChart } from '@mui/x-charts';
import { Box } from '@mui/material';

// Se você já criou o arquivo de constantes na Task #313, pode importar aqui:
// import { CHART_COLORS } from '@/constants/chartColors';

const BarChartAgrupado = ({ dados }) => {
  
  // Se não estiver usando o arquivo de constantes, mantenha as locais:
  const COR_CORRETA = "#2e7d32";
  const COR_INCORRETA = "#d32f2f";

  // valueFormatter agora recebe o contexto ({ dataIndex }) para acessar os dados brutos
  const valueFormatter = (value, { dataIndex }) => {
    if (value === null) return '';
    
    const item = dados[dataIndex];
    
    // Calcula o total somando acertos e erros (usando Number para garantir segurança)
    const total = (Number(item.acertos) || 0) + (Number(item.erros) || 0);
    
    // Calcula a porcentagem
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    
    return `${value} alunos (${percent}%)`;
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '600px', 
      mx: 'auto' 
    }}>
      <BarChart
        dataset={dados}
        xAxis={[{ 
          scaleType: 'band', 
          dataKey: 'nome', 
          label: 'Afirmação' 
        }]}
        yAxis={[{ 
          // Alterado para refletir que agora mostramos quantidade, não só %
          label: 'Nº de Respostas', 
          // Removido max: 100 para suportar turmas grandes
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
        margin={{ top: 40, right: 20, left: 60, bottom: 30 }}
        slotProps={{
          legend: { hidden: true },
        }}
      />
    </Box>
  );
};

export default BarChartAgrupado;