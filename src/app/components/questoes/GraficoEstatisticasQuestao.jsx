"use client";

import React from 'react';
import { BarChart, PieChart } from '@mui/x-charts';
import { Typography, Box } from '@mui/material';

/**
 * Componente para renderizar os gráficos de estatísticas de uma questão.
 * Task #225: Refatorado para usar @mui/x-charts em vez de recharts.
 *
 * @param {string} tipoQuestao - 'multipla-escolha', 'verdadeiro-falso', etc
 * @param {Array<object>} dados - Os dados da API (ex: [{ nome: 'A', Respostas: 10, correta: false }, ...])
 * @param {string|number} [valorCorreto] - (Opcional) O valor exato da resposta correta (ex: 15.5)
 */
const GraficoEstatisticasQuestao = ({ tipoQuestao, dados, valorCorreto }) => {

  // Define as cores
  const COR_CORRETA = "#2e7d32"; 
  const COR_INCORRETA = "#d32f2f"; 

  // Lógica para o Gráfico de Barras (Múltipla Escolha / Resposta Numérica / Somatório)
  const renderGraficoBarras = (labelEixoX = 'Alternativa', valorExato = null) => {

    const dadosProcessados = dados.map(entry => ({
      nome: entry.nome,
      RespostasCorretas: entry.correta ? entry.Respostas : undefined,
      RespostasIncorretas: !entry.correta ? entry.Respostas : undefined,
    }));

    // Lógica para o Tooltip (Nº e %)
    const totalRespostas = dados.reduce((sum, entry) => sum + entry.Respostas, 0);
    const valueFormatter = (value, { dataIndex }) => {
      if (value === null || value === undefined) return null;

      const porcentagem = totalRespostas > 0 ? ((value / totalRespostas) * 100).toFixed(1) : 0;
      const baseString = `Nº de Respostas: ${value} (${porcentagem}%)`;

      // Adicionar o valor exato ao tooltip da barra correta
      // Usamos 'dados' (o array original) para checar se a barra é a correta
      const itemOriginal = dados[dataIndex];
      if (itemOriginal.correta && valorExato !== null) {
        // '\n' quebra a linha dentro do tooltip
        return `${baseString} | Valor Correto: ${valorExato}`; 
      }

      return baseString;
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

  // Lógica para o Gráfico de Barras Agrupadas (V/F - Múltiplas Afirmações)
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

  // Lógica Principal de Renderização
  if (!dados || dados.length === 0) {
    return <Typography>Não há dados de estatística para esta questão.</Typography>;
  }
  
  
  // Decide qual gráfico renderizar
  switch (tipoQuestao) {
    case 'multipla-escolha':
      return renderGraficoBarras('Alternativa');

    case 'verdadeiro-falso':
      return renderGraficoBarrasAgrupadas();

    case 'numerica':
      return renderGraficoBarras('Faixa de Resposta', valorCorreto);

    case 'somatorio':
      return renderGraficoBarras('Soma Submetida', valorCorreto);

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
  { nome: 'I', acertos: 85, erros: 15 },
  { nome: 'II', acertos: 62, erros: 38 },
  { nome: 'III', acertos: 70, erros: 30 },
];

const mockDadosNumerica = [
  { nome: '0-10', Respostas: 5, correta: false },
  { nome: '11-20', Respostas: 12, correta: true },
  { nome: '21-30', Respostas: 8, correta: false },
  { nome: '31-40', Respostas: 3, correta: false },
];
const mockValorCorretoNumerica = 15.5;

const mockDadosSomatorio = [
  { nome: '03', Respostas: 10, correta: false },
  { nome: '05', Respostas: 25, correta: true },
  { nome: '07', Respostas: 12, correta: false },
  { nome: '14', Respostas: 8, correta: false },
];
const mockValorCorretoSomatorio = '05';

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
        Teste - Gráfico Verdadeiro/Falso (Agrupado)
      </Typography>
      <GraficoEstatisticasQuestao 
        tipoQuestao="verdadeiro-falso" 
        dados={mockDadosVFAgrupado} 
      />
      
      <Box sx={{ my: 4 }} /> 

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Gráfico Resposta Numérica (Histograma)
      </Typography>
      <GraficoEstatisticasQuestao 
        tipoQuestao="numerica" 
        dados={mockDadosNumerica} 
        valorCorreto={mockValorCorretoNumerica} 
      />
      
      <Box sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Gráfico Somatório (Frequência)
      </Typography>
      <GraficoEstatisticasQuestao 
        tipoQuestao="somatorio" 
        dados={mockDadosSomatorio}
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