'use client';
import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Card, CardContent, Typography, useTheme, Box } from '@mui/material';

export default function StudentPerformanceChart({ 
  labels = [], 
  scores = [], 
  // Novas props para séries separadas
  provasLabels = [],
  provasScores = [],
  listasLabels = [],
  listasScores = [],
  text, 
  height = 480, 
  disabledTitle = 'Sem dados disponíveis',
  lineColor,
  // Flag para usar modo de duas séries
  showBothSeries = false,
 }) {
  const theme = useTheme();

  // Cores para as séries
  const provasColor = '#7c4dff'; // Roxo para provas
  const listasColor = '#00bcd4'; // Ciano para listas

  // Modo de duas séries (provas e listas separadas)
  if (showBothSeries) {
    const hasProvasData = Array.isArray(provasScores) && provasScores.length > 0 && provasScores.some((n) => Number.isFinite(n));
    const hasListasData = Array.isArray(listasScores) && listasScores.length > 0 && listasScores.some((n) => Number.isFinite(n));
    const hasAnyData = hasProvasData || hasListasData;

    // Construir séries separadas - cada uma com seus próprios pontos
    const series = [];
    
    // Usar os nomes das atividades como labels no eixo X
    // Combinar os labels de provas e listas
    const maxPoints = Math.max(provasLabels.length, listasLabels.length, 1);
    
    // Criar labels combinados - mostrar nome da prova/lista
    const xAxisLabels = [];
    for (let i = 0; i < maxPoints; i++) {
      const provaLabel = provasLabels[i] || '';
      const listaLabel = listasLabels[i] || '';
      // Usar o label que existir, ou combinar se ambos existirem
      if (provaLabel && listaLabel) {
        xAxisLabels.push(`${i + 1}`); // Usar número se ambos existirem
      } else {
        xAxisLabels.push(provaLabel || listaLabel || `${i + 1}`);
      }
    }

    if (hasProvasData) {
      const provasData = [...provasScores];
      while (provasData.length < maxPoints) {
        provasData.push(null);
      }
      series.push({
        data: provasData,
        label: 'Provas',
        color: provasColor,
        connectNulls: true,
      });
    }
    
    if (hasListasData) {
      const listasData = [...listasScores];
      while (listasData.length < maxPoints) {
        listasData.push(null);
      }
      series.push({
        data: listasData,
        label: 'Listas',
        color: listasColor,
        connectNulls: true,
      });
    }

    return (
      <Card sx={{ borderRadius: 2, p: 2, opacity: hasAnyData ? 1 : 0.8 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {text}
          </Typography>

          {!hasAnyData ? (
            <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">{disabledTitle}</Typography>
            </Box>
          ) : (
            <LineChart
              height={height}
              xAxis={[{ data: xAxisLabels, scaleType: 'point' }]}
              yAxis={[{ min: 0, max: 10, tickNumber: 6 }]}
              series={series}
              margin={{ left: 40, right: 50, top: 30, bottom: 60 }}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Modo original (série única)
  const hasLabelData = Array.isArray(labels) && labels.length > 0;
  const hasScoreData = Array.isArray(scores) && scores.length > 0 && scores.some((n) => Number.isFinite(n));
  const hasData = hasLabelData && hasScoreData;

  return (
    <Card sx={{ borderRadius: 2, p: 2, opacity: hasData ? 1 : 0.8 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {text}
        </Typography>

        {!hasData ? (
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">{disabledTitle}</Typography>
          </Box>
        ) : (
          <LineChart
            height={height}
            xAxis={[{ data: labels, scaleType: 'point' }]}
            yAxis={[{ min: 0, max: 10, tickNumber: 6 }]}
            series={[
              {
                data: scores,
                label: 'Nota',
                color:
                  lineColor ??
                  theme.palette.accent?.main ??
                  theme.palette.primary.main, 
              },
            ]}
            margin={{ left: 40, right: 50, top: 30, bottom: 40 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
