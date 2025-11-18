// page.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DesempenhoPage from '../src/app/(app)/desempenho/page'; 

// --- Mock dos Componentes Filhos ---
// Vamos simular o que eles fazem: apenas renderizar as props que recebem
// para que possamos verificar se as props corretas foram passadas.

// Mock do PerformanceSummary
jest.mock('../src/app/components/PerformanceSummary', () => {
  
  return jest.fn(({ average, best, latest }) => (
    <div data-testid="performance-summary">
      <span>Média: {String(average)}</span>
      <span>Melhor: {String(best)}</span>
      <span>Última: {String(latest)}</span>
    </div>
  ));
});

// Mock do StudentPerformanceChart
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
  
  // Limpa os mocks antes de cada teste para garantir um estado limpo
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o estado inicial corretamente (nenhum curso selecionado)', () => {
    render(<DesempenhoPage />);

    // 1. Verifica o título da página
    expect(screen.getByText('Desempenho')).toBeInTheDocument();

    // 2. Verifica se o seletor de curso está presente com o valor padrão
    const select = screen.getByTestId('course-select');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('nenhum');

    // 3. Verifica o resumo de desempenho (deve estar com valores "vazios")
    // O cálculo de 0/0 é NaN
    // Math.max() sem argumentos é -Infinity
    // O último item de um array vazio é undefined
    expect(screen.getByText('Média: NaN')).toBeInTheDocument();
    expect(screen.getByText('Melhor: -Infinity')).toBeInTheDocument();
    expect(screen.getByText('Última: undefined')).toBeInTheDocument();

    // 4. Verifica os gráficos (devem estar presentes, mas com dados vazios)
    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos:'); // Vazio
    expect(provasChart).toHaveTextContent('Pontuações:'); // Vazio

    const listasChart = screen.getByTestId('chart-Listas de Exercícios');
    expect(listasChart).toHaveTextContent('Rótulos:'); // Vazio
  });

  it('deve atualizar os dados ao selecionar "Cálculo I"', () => {
    render(<DesempenhoPage />);

    // 1. Encontra o seletor
    const select = screen.getByTestId('course-select');

    // 2. Simula a seleção do usuário para "Cálculo I"
    fireEvent.change(select, { target: { value: 'calculo' } });

    // 3. Verifica se o resumo de desempenho foi atualizado
    // Dados de 'calculo' (combined): [68, 82, 74, 86, 80, 51, 23]
    // Média: 464 / 7 = 66.2857...
    // Melhor: 86
    // Última: 23
    expect(screen.getByText('Média: 66.28571428571429')).toBeInTheDocument();
    expect(screen.getByText('Melhor: 86')).toBeInTheDocument();
    expect(screen.getByText('Última: 23')).toBeInTheDocument();

    // 4. Verifica o gráfico de Provas
    // Labels: ['Prova 1', 'Prova 2', 'Prova 3'], Scores: [68, 74, 80]
    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos: Prova 1,Prova 2,Prova 3');
    expect(provasChart).toHaveTextContent('Pontuações: 68,74,80');

    // 5. Verifica o gráfico de Listas
    // Labels: ['Lista 1', ...], Scores: [82, 86, 51, 23]
    const listasChart = screen.getByTestId('chart-Listas de Exercícios');
    expect(listasChart).toHaveTextContent('Rótulos: Lista 1,Lista 2,Lista 3,Lista 4');
    expect(listasChart).toHaveTextContent('Pontuações: 82,86,51,23');
  });

  it('deve atualizar os dados ao selecionar "Física Geral"', () => {
    render(<DesempenhoPage />);

    // 1. Simula a seleção do usuário para "Física Geral"
    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'fisica' },
    });

    // 2. Verifica o resumo de desempenho
    // Dados de 'fisica' (combined): [79, 88, 85, 90, 77] (Nota: há um bug nos seus dados, veja abaixo)
    // Média: 419 / 5 = 83.8
    // Melhor: 90
    // Última: 77
    expect(screen.getByText('Média: 83.8')).toBeInTheDocument();
    expect(screen.getByText('Melhor: 90')).toBeInTheDocument();
    expect(screen.getByText('Última: 77')).toBeInTheDocument();

    // 3. Verifica o gráfico de Provas
    // Labels: ['Prova 1', 'Prova 2', 'Prova 3'], Scores: [79, 85, 77]
    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos: Prova 1,Prova 2,Prova 3');
    expect(provasChart).toHaveTextContent('Pontuações: 79,85,77');
  });

  it('deve voltar ao estado inicial ao selecionar "Nenhum" novamente', () => {
    render(<DesempenhoPage />);

    // 1. Seleciona "Cálculo I"
    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'calculo' },
    });

    // 2. Verifica se mudou (só para garantir)
    expect(screen.getByText('Melhor: 86')).toBeInTheDocument();

    // 3. Simula a seleção de "Nenhum"
    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'nenhum' },
    });

    // 4. Verifica se o resumo voltou ao estado inicial
    expect(screen.getByText('Média: NaN')).toBeInTheDocument();
    expect(screen.getByText('Melhor: -Infinity')).toBeInTheDocument();
    expect(screen.getByText('Última: undefined')).toBeInTheDocument();

    // 5. Verifica se os gráficos voltaram ao estado inicial
    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos:'); // Vazio
    expect(provasChart).toHaveTextContent('Pontuações:'); // Vazio
  });
});