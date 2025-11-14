'use client';
import React from 'react';
import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

export default function PerformanceSummary({ average = NaN, best = NaN, latest = NaN }) {
  const hasAverage = Number.isFinite(average);
  const hasBest = Number.isFinite(best);
  const hasLatest = Number.isFinite(latest);

  const valueOrDash = (v) => (Number.isFinite(v) ? `${v.toFixed(1)}` : '-');

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
      <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Média Geral
            </Typography>
            <Typography variant="h5">{valueOrDash(average)}</Typography>
          </Box>
          {hasAverage ? (
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, average))}
              sx={{ mt: 1, height: 8, borderRadius: 2 }}
            />
          ) : (
            <Box sx={{ mt: 1, height: 8 }} />
          )}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Melhor Nota
            </Typography>
            <Typography variant="h5">{valueOrDash(best)}</Typography>
          </Box>
          {hasBest ? (
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, best))}
              sx={{ mt: 1, height: 8, borderRadius: 2 }}
            />
          ) : (
            <Box sx={{ mt: 1, height: 8 }} />
          )}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Última Avaliação
            </Typography>
            <Typography variant="h5">{valueOrDash(latest)}</Typography>
          </Box>
          {hasLatest ? (
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, latest))}
              sx={{ mt: 1, height: 8, borderRadius: 2 }}
            />
          ) : (
            <Box sx={{ mt: 1, height: 8 }} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
