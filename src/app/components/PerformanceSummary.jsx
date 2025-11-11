'use client';
import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

export default function PerformanceSummary({ average, best, latest }) {
  return (
    <Box
      component="section"
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
      }}
    >
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Média Geral
          </Typography>
          <Typography variant="h5">{average.toFixed(1)}%</Typography>
          <LinearProgress
            variant="determinate"
            value={average}
            sx={{ mt: 1, height: 8, borderRadius: 2 }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Melhor Nota
          </Typography>
          <Typography variant="h5">{best.toFixed(1)}%</Typography>
          <LinearProgress
            variant="determinate"
            value={best}
            sx={{ mt: 1, height: 8, borderRadius: 2 }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Última Avaliação
          </Typography>
          <Typography variant="h5">{latest.toFixed(1)}%</Typography>
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
