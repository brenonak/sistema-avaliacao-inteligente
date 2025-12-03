// Teste na lógica dos Chips de destaque no componente HistogramaNotas.jsx

import React from 'react'
import { render, screen } from '@testing-library/react'
import HistogramaNotas from '../HistogramaNotas'

// Mock do @mui/x-charts para não quebrar o teste, desenhando apenas uma <div> com texto
// Para focar no teste na lógica dos Chips
jest.mock('@mui/x-charts', () => ({
  BarChart: () => <div data-testid="mock-chart">Gráfico Renderizado</div>,
}));

describe('HistogramaNotas Component', () => {
  it('deve renderizar os chips de destaque com os valores corretos vindos da prop meta', () => {
    const dadosMock = [
      { nome: '0 - 2.0', Respostas: 2 },
      { nome: '8.1 - 10.0', Respostas: 4 }
    ];
    
    // Metadados que ativam os Chips
    const metaMock = {
      qndNotaMinima: 2,
      qndNotaMaxima: 4
    };

    render(<HistogramaNotas dados={dadosMock} meta={metaMock} />);

    // Verifica se o texto "Nota Mínima: 2 alunos" está na tela
    expect(screen.getByText(/Nota Mínima: 2 alunos/i)).toBeInTheDocument();

    // Verifica se o texto "Nota Máxima: 4 alunos" está na tela
    expect(screen.getByText(/Nota Máxima: 4 alunos/i)).toBeInTheDocument();
  });
});