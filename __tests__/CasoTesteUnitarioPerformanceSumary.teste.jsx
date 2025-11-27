import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformanceSummary from '../src/app/components/PerformanceSummary';

describe('PerformanceSummary Component', () => {
  
  
  it('deve renderizar os valores formatados corretamente quando existem dados', () => {
    
    render(<PerformanceSummary average={75.5} best={90} latest={82} />);

    
    expect(screen.getByText('Média Geral')).toBeInTheDocument();
    expect(screen.getByText('Melhor Nota')).toBeInTheDocument();
    expect(screen.getByText('Última Avaliação')).toBeInTheDocument();

    expect(screen.getByText('75.5')).toBeInTheDocument();
    expect(screen.getByText('90.0')).toBeInTheDocument(); 
    expect(screen.getByText('82.0')).toBeInTheDocument();
  });

  
  it('deve renderizar traços "-" quando não existirem dados', () => {
    
    render(<PerformanceSummary />);

    
    expect(screen.getByText('Média Geral')).toBeInTheDocument();

    const dashes = screen.getAllByText('-');
    
    expect(dashes).toHaveLength(3);
  });
});