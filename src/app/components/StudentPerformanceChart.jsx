'use client';
import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Card, CardContent, Typography, useTheme, Box } from '@mui/material';

export default function StudentPerformanceChart({ labels = [], scores = [], text, height = 480, disabledTitle = 'Sem dados disponíveis' }) {
  const theme = useTheme();

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
            yAxis={[{ min: 0, max: 100, tickNumber: 6 }]}
            series={[
              {
                data: scores,
                label: 'Nota',
                color: theme.palette.accent?.main || theme.palette.primary.main,
              },
            ]}
            margin={{ left: 20, right: 50, top: 30, bottom: 40 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
