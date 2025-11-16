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
      RespostasCorretas: entry.correta ? entry.Respostas : undefined,
      RespostasIncorretas: !entry.correta ? entry.Respostas : undefined,
    }));

    // Lógica para o Tooltip (Nº e %)
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
          margin={{ top: 20, right: 20, left: 50, bottom: 20 }}
          slotProps={{
            legend: { hidden: true },
          }}
          tooltip={{ trigger: 'item' }}
        />
      </Box>
    );
  };

  // --- Lógica para o Gráfico de Barras Agrupadas (V/F - Múltiplas Afirmações) ---
  const renderGraficoBarrasAgrupadas = () => {
    
    // O formatador do tooltip agora é simples, apenas adiciona '%'
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
            max: 100 // Definimos o máximo como 100%
          }]}
          // A "mágica" do agrupamento acontece aqui:
          // Duas séries de dados, em vez de empilhadas (stack),
          // elas são renderizadas lado a lado.
          series={[
            { 
              dataKey: 'acertos', 
              label: 'Acertos', // O 'label' é importante para a legenda
              valueFormatter,
            },
            { 
              dataKey: 'erros', 
              label: 'Erros',
              valueFormatter,
            }
          ]}
          // Usamos as mesmas cores, que agora serão mapeadas para as séries
          colors={[COR_CORRETA, COR_INCORRETA]}
          height={300}
          margin={{ top: 40, right: 20, left: 60, bottom: 30 }} // Damos espaço para a legenda no topo
          
          // NÃO escondemos a legenda, ela é necessária aqui
          // slotProps={{
          //   legend: { hidden: true }, 
          // }}
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
      return renderGraficoBarrasAgrupadas();
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

const mockDadosVFAgrupado = [
  { nome: 'Afirmação I', acertos: 85, erros: 15 },
  { nome: 'Afirmação II', acertos: 62, erros: 38 },
  { nome: 'Afirmação III', acertos: 70, erros: 30 },
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