import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardAlunoPage from '../src/app/(app)/(aluno)/aluno/dashboard/page';

jest.mock('../src/app/components/PerformanceSummary', () => {
  return jest.fn(({ average, best, latest }) => (
    <div data-testid="performance-summary">
      <span>Média: {String(average)}</span>
      <span>Melhor: {String(best)}</span>
      <span>Última: {String(latest)}</span>
    </div>
  ));
});

jest.mock('../src/app/components/StudentPerformanceChart', () => {
  return jest.fn(({ labels, scores, text }) => (
    <div data-testid={`chart-${text}`}>
      <span>{text}</span>
      <span>Rótulos: {labels.join(',')}</span>
      <span>Pontuações: {scores.join(',')}</span>
    </div>
  ));
});

const mockApiResponse = {
  data: {
    labels: ['1° Semestre', '2° Semestre', '3° Semestre', '4° Semestre', '5° Semestre', '6° Semestre'],
    scores: [94, 85, 78, 88, 91, 85],
  }
};

describe('DashboardAlunoPage', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    );
  });

  it('deve renderizar o estado inicial corretamente', async () => {
    render(<DashboardAlunoPage />);

    expect(screen.getByText('Média: 85')).toBeInTheDocument();
    expect(screen.getByText('Melhor: 94')).toBeInTheDocument();
    expect(screen.getByText('Última: 81')).toBeInTheDocument();
  });
});