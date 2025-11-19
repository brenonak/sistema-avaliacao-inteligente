// page.test.jsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DesempenhoPage from '../src/app/(app)/desempenho/page'; 


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


jest.mock('../src/app/components/CourseSelect', () => {
  return jest.fn(({ selectedCourse, onCourseChange, courses }) => (
    <select
      data-testid="course-select"
      value={selectedCourse}
      onChange={(e) => onCourseChange(e.target.value)}
    >
      {courses.map((course) => (
        <option key={course.id} value={course.id}>
          {course.name}
        </option>
      ))}
    </select>
  ));
});

// --- Testes ---

describe('DesempenhoPage', () => {
  
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o estado inicial corretamente (nenhum curso selecionado)', () => {
    render(<DesempenhoPage />);

    expect(screen.getByText('Desempenho')).toBeInTheDocument();

    const select = screen.getByTestId('course-select');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('nenhum');

    expect(screen.getByText('Média: NaN')).toBeInTheDocument();
    expect(screen.getByText('Melhor: -Infinity')).toBeInTheDocument();
    expect(screen.getByText('Última: undefined')).toBeInTheDocument();

    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos:'); // Vazio
    expect(provasChart).toHaveTextContent('Pontuações:'); // Vazio

    const listasChart = screen.getByTestId('chart-Listas de Exercícios');
    expect(listasChart).toHaveTextContent('Rótulos:'); // Vazio
  });

  it('deve atualizar os dados ao selecionar "Cálculo I"', () => {
    render(<DesempenhoPage />);

    const select = screen.getByTestId('course-select');

  fireEvent.change(select, { target: { value: 'calculo' } });

    expect(screen.getByText('Média: 66.28571428571429')).toBeInTheDocument();
    expect(screen.getByText('Melhor: 86')).toBeInTheDocument();
    expect(screen.getByText('Última: 23')).toBeInTheDocument();

    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos: Prova 1,Prova 2,Prova 3');
    expect(provasChart).toHaveTextContent('Pontuações: 68,74,80');

    const listasChart = screen.getByTestId('chart-Listas de Exercícios');
    expect(listasChart).toHaveTextContent('Rótulos: Lista 1,Lista 2,Lista 3,Lista 4');
    expect(listasChart).toHaveTextContent('Pontuações: 82,86,51,23');
  });

  it('deve atualizar os dados ao selecionar "Física Geral"', () => {
    render(<DesempenhoPage />);

    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'fisica' },
    });

    expect(screen.getByText('Média: 83.8')).toBeInTheDocument();
    expect(screen.getByText('Melhor: 90')).toBeInTheDocument();
    expect(screen.getByText('Última: 77')).toBeInTheDocument();

    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos: Prova 1,Prova 2,Prova 3');
    expect(provasChart).toHaveTextContent('Pontuações: 79,85,77');
  });

  it('deve voltar ao estado inicial ao selecionar "Nenhum" novamente', () => {
    render(<DesempenhoPage />);



    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'calculo' },
    });

    expect(screen.getByText('Melhor: 86')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'nenhum' },
    });

    expect(screen.getByText('Média: NaN')).toBeInTheDocument();
    expect(screen.getByText('Melhor: -Infinity')).toBeInTheDocument();
    expect(screen.getByText('Última: undefined')).toBeInTheDocument();

    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos:'); 
    expect(provasChart).toHaveTextContent('Pontuações:'); 
  });
});