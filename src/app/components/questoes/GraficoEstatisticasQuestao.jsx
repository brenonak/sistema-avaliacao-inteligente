"use client";

import React from 'react';
import { BarChart, PieChart } from '@mui/x-charts';
import { Typography, Box, Chip, Stack } from '@mui/material';

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

  // Lógica Principal de Renderização
  if (!dados || dados.length === 0) {
    return <Typography>Não há dados de estatística para esta questão.</Typography>;
  }


  // Decide qual gráfico renderizar
  switch (tipoQuestao) {
    case 'alternativa':
      return renderGraficoBarras('Alternativa');

    case 'afirmacoes':
      return renderGraficoBarrasAgrupadas();

    case 'numerica':
      return renderGraficoBarras('Respostas Submetidas');

    case 'proposicoes':
      return renderGraficoBarras('Soma Submetida');

    case 'dissertativa':
      // USANDO O NOVO COMPONENTE
      return <HistogramaNotas dados={dados} meta={meta} />;

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

const mockDadosNumericaFrequencia = [
  { nome: '15.5', Respostas: 12, correta: true },    // A Resposta Correta
  { nome: '15500', Respostas: 8, correta: false },  // Erro Comum 1 (ex: erro de unidade)
  { nome: '12.2', Respostas: 5, correta: false },   // Erro Comum 2
  { nome: '31.0', Respostas: 4, correta: false },   // Erro Comum 3 (ex: esqueceu de dividir por 2)
  { nome: 'Outros', Respostas: 2, correta: false },   // Todos os outros erros
];

const mockDadosSomatorio = [
  { nome: '03', Respostas: 10, correta: false },
  { nome: '05', Respostas: 25, correta: true },
  { nome: '07', Respostas: 12, correta: false },
  { nome: '14', Respostas: 8, correta: false },
];

const mockDadosDissertativa = [
  { nome: '0 - 2.0', Respostas: 3 },
  { nome: '2.1 - 4.0', Respostas: 5 },
  { nome: '4.1 - 6.0', Respostas: 8 },
  { nome: '6.1 - 8.0', Respostas: 10 },
  { nome: '8.1 - 10.0', Respostas: 7 },
];
const qndNotaMinima = 2; // Exemplo
const qndNotaMaxima = 4;  // Exemplo

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
        tipoQuestao="alternativa"
        dados={mockDadosBarra}
      />

      <Box sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Gráfico Verdadeiro/Falso (Agrupado)
      </Typography>
      <GraficoEstatisticasQuestao
        tipoQuestao="afirmacoes"
        dados={mockDadosVFAgrupado}
      />

      <Box sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Gráfico Resposta Numérica
      </Typography>
      <GraficoEstatisticasQuestao
        tipoQuestao="numerica"
        dados={mockDadosNumericaFrequencia}
      />

      <Box sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Gráfico Somatório
      </Typography>
      <GraficoEstatisticasQuestao
        tipoQuestao="proposicoes"
        dados={mockDadosSomatorio}
      />

      <Box sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Gráfico Dissertativa (Distribuição de Notas)
      </Typography>
      <GraficoEstatisticasQuestao
        tipoQuestao="dissertativa"
        dados={mockDadosDissertativa}
      />

      <Box sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Teste - Sem Dados
      </Typography>
      <GraficoEstatisticasQuestao
        tipoQuestao="alternativa"
        dados={[]}
      />
    </Box>
  );
};

// Exporte o componente real para ser usado na próxima task
export default GraficoEstatisticasQuestao;