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

    // Combinar todos os labels únicos e ordenar por data
    const allLabels = [...new Set([...provasLabels, ...listasLabels])];
    
    // Criar arrays de scores com null para pontos sem dados
    const provasDataAligned = allLabels.map(label => {
      const idx = provasLabels.indexOf(label);
      return idx !== -1 ? provasScores[idx] : null;
    });
    
    const listasDataAligned = allLabels.map(label => {
      const idx = listasLabels.indexOf(label);
      return idx !== -1 ? listasScores[idx] : null;
    });

    const series = [];
    if (hasProvasData) {
      series.push({
        data: provasDataAligned,
        label: 'Provas',
        color: provasColor,
        connectNulls: false,
      });
    }
    if (hasListasData) {
      series.push({
        data: listasDataAligned,
        label: 'Listas',
        color: listasColor,
        connectNulls: false,
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
              xAxis={[{ data: allLabels, scaleType: 'point' }]}
              yAxis={[{ min: 0, max: 10, tickNumber: 6 }]}
              series={series}
              margin={{ left: 40, right: 50, top: 30, bottom: 40 }}
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
