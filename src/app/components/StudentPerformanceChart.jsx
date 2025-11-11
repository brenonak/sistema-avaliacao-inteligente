'use client';
import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Card, CardContent, Typography, useTheme } from '@mui/material';
export default function StudentPerformanceChart({ labels, scores, text, height = 480 }) {
  const theme = useTheme();

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          { text }
        </Typography>
        <LineChart
          height={height}
          xAxis={[{ data: labels, scaleType: 'point' }]} 
          yAxis={[{ min: 0, max: 100, tickNumber: 6 }]}
          series={[{ data: scores, label: 'Nota (%)', color: theme.palette.accent?.main || theme.palette.primary.main }]}
          margin={{ left: 20, right: 50, top: 30, bottom: 40 }}
        />
      </CardContent>
    </Card>
  );
}
