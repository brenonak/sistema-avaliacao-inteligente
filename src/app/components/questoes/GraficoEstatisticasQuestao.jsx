"use client";

import React from 'react';
import { Typography, Box, } from '@mui/material';

/**
 * Componente Orquestrador para gráficos de estatísticas.
 * Refatorado para delegar a renderização para componentes especializados.
 */
import HistogramaNotas from './charts/HistogramaNotas';
import BarChartFrequencia from './charts/BarChartFrequencia';
import BarChartAgrupado from './charts/BarChartAgrupado';




/**
 * Componente para renderizar os gráficos de estatísticas de uma questão.
 * Task #225: Refatorado para usar @mui/x-charts em vez de recharts.
 *
 * @param {string} tipoQuestao - 'alternativa', 'afirmacoes', etc
 * @param {Array<object>} dados - Os dados da API (ex: [{ nome: 'A', Respostas: 10, correta: false }, ...])
 * @param {string|number} [valorCorreto] - (Opcional) O valor exato da resposta correta (ex: 15.5)
 */
const GraficoEstatisticasQuestao = ({ tipoQuestao, dados, valorCorreto, meta }) => {

  // Validação de dados vazios
  if (!dados || dados.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Não há dados de estatística disponíveis para esta questão.
        </Typography>
      </Box>
    );
  }


  // Decide qual gráfico renderizar
  switch (tipoQuestao) {
    case 'alternativa':
      return <BarChartFrequencia dados={dados} labelEixoX="Alternativa" />;

    case 'afirmacoes':
      return <BarChartAgrupado dados={dados} />;

    case 'numerica':
      return <BarChartFrequencia dados={dados} labelEixoX="Respostas Submetidas" />;

    case 'proposicoes':
      return <BarChartFrequencia dados={dados} labelEixoX="Soma Submetida" />;

    case 'dissertativa':
      // USANDO O NOVO COMPONENTE
      return <HistogramaNotas dados={dados} meta={meta} />;

    default:
      return (
        <Typography color="error" align="center">
          Tipo de questão não suportado para estatísticas.
        </Typography>
      );
  }
};


export default GraficoEstatisticasQuestao;