"use client";

import React from 'react';
import { BarChart, PieChart } from '@mui/x-charts';
import { Typography, Box } from '@mui/material';

/**
 * Componente para renderizar os gráficos de estatísticas de uma questão.
 * Task #225: Refatorado para usar @mui/x-charts em vez de recharts.
 *
 * @param {string} tipoQuestao - 'multipla-escolha' ou 'verdadeiro-falso'
 * @param {Array<object>} dados - Os dados da API (ex: [{ nome: 'A', Respostas: 10, correta: false }, ...])
 */
const GraficoEstatisticasQuestao = ({ tipoQuestao, dados }) => {

  // Define as cores
  const COR_CORRETA = "#2e7d32"; 
  const COR_INCORRETA = "#d32f2f"; 

  // Lógica para o Gráfico de Barras (Múltipla Escolha)
  const renderGraficoBarras = () => {

    // CORREÇÃO 2: Processar os dados para criar duas séries (correta/incorreta)
    const dadosProcessados = dados.map(entry => ({
      nome: entry.nome,
      RespostasCorretas: entry.correta ? entry.Respostas : null,
      RespostasIncorretas: !entry.correta ? entry.Respostas : null,
    }));

    // Lógica para o Tooltip (Nº e %)
    const totalRespostas = dados.reduce((sum, entry) => sum + entry.Respostas, 0);
    const valueFormatter = (value) => {
      if (value === null) return '';
      const porcentagem = totalRespostas > 0 ? ((value / totalRespostas) * 100).toFixed(1) : 0;
      return `Nº de Respostas: ${value} (${porcentagem}%)`;
    };

    return (
      // Envolve o BarChart numa Box para centralização
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <BarChart
          dataset={dadosProcessados} 
          xAxis={[{ 
            scaleType: 'band', 
            dataKey: 'nome', // Eixo X usa a chave 'nome' (A, B, C, D)
            label: 'Alternativa' 
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
          colors={[COR_CORRETA, COR_INCORRETA]}
          height={300}
          width={500} 
          margin={{ top: 20, right: 20, left: 50, bottom: 20 }}
          // CORREÇÃO 6: Esconder a legenda (que agora apareceria)
          slotProps={{
            legend: { hidden: true },
          }}
        />
      </Box>
    );
  };

  // Lógica para o Gráfico de Rosca (Verdadeiro/Falso)
  const renderGraficoRosca = () => {
    
    const dadosFormatados = dados.map((entry, index) => ({
      id: index,
      value: entry.Respostas,
      label: entry.nome,
      correta: entry.correta,
    }));
  
    const colorsArray = dadosFormatados.map(entry => entry.correta ? COR_CORRETA : COR_INCORRETA);

    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 1 }}>
          Distribuição de Respostas
        </Typography> 
        <PieChart
          colors={colorsArray} 
          series={[{
            data: dadosFormatados, 
            outerRadius: 100,
            // 5. Formata os rótulos (Nome XX.X%)
            valueFormatter: (value, { dataIndex }) => {
              const item = dadosFormatados[dataIndex];
              const total = dadosFormatados.reduce((sum, i) => sum + i.value, 0);
              const percent = total > 0 ? (item.value / total) * 100 : 0;
              return `${item.label} (${percent.toFixed(1)}%)`;
            },
          }]}
          height={300}
          width={500}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          slotProps={{
            legend: { hidden: true },
          }}
        />
      </Box>
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

/*
 * ====================================================================
 * DADOS MOCKADOS E EXEMPLO DE USO (PARA TESTE)
 * ====================================================================
 */

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

/**
 * Componente de Teste Wrapper
 */
export const TesteGraficoEstatisticas = () => {
  return (
    <Box sx={{ width: '100%', p: 4, bgcolor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Gráfico Múltipla Escolha
      </Typography>
      <GraficoEstatisticasQuestao 
        tipoQuestao="multipla-escolha" 
        dados={mockDadosBarra} 
      />
      
      <Box sx={{ my: 4 }} /> 

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Gráfico Verdadeiro/Falso
      </Typography>
      <GraficoEstatisticasQuestao 
        tipoQuestao="verdadeiro-falso" 
        dados={mockDadosRosca} 
      />
      
      <Box sx={{ my: 4 }} /> 

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
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