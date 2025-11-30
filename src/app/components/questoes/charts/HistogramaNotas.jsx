"use client";

import React from 'react';
import { BarChart, PieChart } from '@mui/x-charts';
import { Typography, Box, Chip, Stack } from '@mui/material';
import { CHART_COLORS } from '../../../../constants/chartColors';

const HistogramaNotas = ({ dados, meta }) => {

    const { qndNotaMinima = 0, qndNotaMaxima = 0 } = meta || {};

    const totalRespostas = dados.reduce((sum, entry) => sum + entry.Respostas, 0);

    const valueFormatter = (value) => {
      // Se o valor for nulo (o que acontecerá na maioria das séries), não mostre nada.
      if (value === null || value === undefined) return null

      const porcentagem = totalRespostas > 0 ? ((value / totalRespostas) * 100).toFixed(1) : 0;
      return `Nº de Alunos: ${value} (${porcentagem}%)`;
    };

    // Formata os dados para incluir a cor baseada na faixa de nota
    const seriesFormatadas = dados.map((entry, index) => {
      // Cria um array de 'null's
      const dataArray = new Array(dados.length).fill(null);
      // Coloca o valor da barra na posição correta
      dataArray[index] = entry.Respostas;

      return {
        data: dataArray, // ex: [3, null, null, null, null]
        valueFormatter,  // Aplica o formatter
        stack: 'total',  // Todas as séries ficam na mesma "pilha"
        // O 'label' é removido para evitar o tooltip duplicado
      };
    });

    const labelsEixoX = dados.map(entry => entry.nome);


    return (
      <Box sx={{
        width: '100%',
        maxWidth: '600px',
        mx: 'auto'
      }}>
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: labelsEixoX,
            label: 'Faixa de Nota'
          }]}
          yAxis={[{
            label: 'Nº de Alunos'
          }]}
          // Este gráfico tem apenas UMA série de dados
          series={seriesFormatadas}
          colors={CHART_COLORS.GRADIENT_NOTES}
          height={300}
          margin={{ top: 20, right: 70, left: 20, bottom: 30 }}
          slotProps={{
            legend: { hidden: true }, // Não precisa de legenda
          }}
          tooltip={{ trigger: 'item' }} // Gatilho 'item'
        />

        {/* ADIÇÃO: Área de Destaques (Zero e Dez) */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          <Chip
            label={`Nota Mínima: ${qndNotaMinima} alunos`}
            variant="outlined"
            sx={{
              borderColor: '#d32f2f', // Vermelho
              color: '#d32f2f',
              fontWeight: 'bold'
            }}
          />
          <Chip
            label={`Nota Máxima: ${qndNotaMaxima} alunos`}
            variant="outlined"
            sx={{
              borderColor: '#2e7d32', // Verde
              color: '#2e7d32',
              fontWeight: 'bold'
            }}
          />
        </Stack>

      </Box>
    );
  };

export default HistogramaNotas;