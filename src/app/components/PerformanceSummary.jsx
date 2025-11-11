'use client';
import React from 'react';
import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

export default function PerformanceSummary({ average = 0, best = 0, latest = 0 }) {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        alignItems: 'stretch',
        minHeight: { md: 120 }, // manter altura igual ao CourseSelect
      }}
    >
      <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Média Geral
            </Typography>
            <Typography variant="h5">{Number.isFinite(average) ? average.toFixed(1) : '0.0'}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={average}
            sx={{ mt: 1, height: 8, borderRadius: 2 }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Melhor Nota
            </Typography>
            <Typography variant="h5">{Number.isFinite(best) ? best.toFixed(1) : '0.0'}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={best}
            sx={{ mt: 1, height: 8, borderRadius: 2 }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Última Avaliação
            </Typography>
            <Typography variant="h5">{Number.isFinite(latest) ? latest.toFixed(1) : '0.0'}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={latest}
            sx={{ mt: 1, height: 8, borderRadius: 2 }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
