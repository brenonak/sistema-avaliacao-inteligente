"use client";

import React from 'react';
import { BarChart, PieChart } from '@mui/x-charts';
import { Typography, Box, Chip, Stack } from '@mui/material';


/**
 * Componente para renderizar os gráficos de estatísticas de uma questão.
 * Task #225: Refatorado para usar @mui/x-charts em vez de recharts.
 *
 * @param {string} tipoQuestao - 'alternativa', 'afirmacoes', etc
 * @param {Array<object>} dados - Os dados da API (ex: [{ nome: 'A', Respostas: 10, correta: false }, ...])
 * @param {string|number} [valorCorreto] - (Opcional) O valor exato da resposta correta (ex: 15.5)
 */
const GraficoEstatisticasQuestao = ({ tipoQuestao, dados, valorCorreto, meta }) => {

  // Define as cores
  const COR_CORRETA = "#2e7d32";
  const COR_INCORRETA = "#d32f2f";

  // Gradiente de cores para o Histograma de Notas
  const CORES_GRADIENTE_NOTAS = [
    "#d32f2f", // Vermelho - Notas baixas (0-2)
    "#ff9800", // Laranja - Notas médias baixas (2.1-4)
    "#ffeb3b", // Amarelo - Notas médias (4.1-6)
    "#8bc34a", // Verde Claro - Notas médias altas (6.1-8)
    "#2e7d32", // Verde Escuro - Notas altas (8.1-10)
  ];

  // Lógica para o Gráfico de Barras (Múltipla Escolha / Resposta Numérica / Somatório)
  const renderGraficoBarras = (labelEixoX = 'Alternativa') => {

    const dadosProcessados = dados.map(entry => ({
      nome: entry.nome,
      RespostasCorretas: entry.correta ? entry.Respostas : undefined,
      RespostasIncorretas: !entry.correta ? entry.Respostas : undefined,
    }));

    // Lógica para o Tooltip (Nº e %)
    const totalRespostas = dados.reduce((sum, entry) => sum + entry.Respostas, 0);
    const valueFormatter = (value) => {
      if (value === null || value === undefined) return null; // Alterado de '' para null na refatoração anterior
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

  // Lógica para o Histograma de Notas (Dissertativa)
  const renderHistogramaNotas = () => {
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
        valueFormatter,  // Aplica o formatter
        stack: 'total',  // Todas as séries ficam na mesma "pilha"
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
          colors={CORES_GRADIENTE_NOTAS}
          height={300}
          margin={{ top: 20, right: 20, left: 50, bottom: 30 }}
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
      return renderHistogramaNotas();

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