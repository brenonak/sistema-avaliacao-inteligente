'use client';
import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Card, CardContent, Typography, useTheme } from '@mui/material';
export default function StudentPerformanceChart({ labels, scores }) {
  const theme = useTheme();

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Desempenho ao longo do tempo
        </Typography>
        <LineChart
          height={300}
          xAxis={[{ data: labels, scaleType: 'point' }]}
          series={[{ data: scores, label: 'Notas (%)', color: theme.palette.accent.main }]}
          margin={{ left: 20, right: 50, top: 30, bottom: 40 }}
        />
      </CardContent>
    </Card>
  );
}
