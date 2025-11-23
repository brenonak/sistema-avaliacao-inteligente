import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DesempenhoPage from '../src/app/(app)/(professor)/desempenho/page';


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


const mockApiResponse = {
  cursos: [
    { id: 'calculo', nome: 'Cálculo I' },
    { id: 'fisica', nome: 'Física Geral' }
  ],
  graficosPorCurso: {
    calculo: {
      examsLabels: ['Prova 1', 'Prova 2', 'Prova 3'],
      examsScores: [68, 74, 80],
      listsLabels: ['Lista 1', 'Lista 2', 'Lista 3', 'Lista 4'],
      listsScores: [82, 86, 51, 23],
      
      combinedLabels: ['P1', 'P2', 'P3', 'L1', 'L2', 'L3', 'L4'],
      combinedScores: [68, 74, 80, 82, 86, 51, 23] 
    },
    fisica: {
      examsLabels: ['Prova 1', 'Prova 2', 'Prova 3'],
      examsScores: [79, 85, 77],
      listsLabels: ['Lista 1', 'Lista 2'],
      listsScores: [90, 88],
      
      combinedLabels: ['P1', 'P2', 'L1', 'L2', 'P3'],
      combinedScores: [79, 85, 90, 88, 77] 
    }
  }
};



describe('DesempenhoPage', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    );
  });

  it('deve renderizar o estado inicial corretamente (nenhum curso selecionado)', async () => {
    render(<DesempenhoPage />);
    
    
    await waitFor(() => expect(screen.getByText('Cálculo I')).toBeInTheDocument());

    const select = screen.getByTestId('course-select');
    expect(select).toHaveValue('nenhum');

    expect(screen.getByText('Média: NaN')).toBeInTheDocument();
    expect(screen.getByText('Melhor: -Infinity')).toBeInTheDocument();
    expect(screen.getByText('Última: undefined')).toBeInTheDocument();
  });

  it('deve atualizar os dados ao selecionar "Cálculo I"', async () => {
    render(<DesempenhoPage />);
    
    
    await waitFor(() => expect(screen.getByText('Cálculo I')).toBeInTheDocument());

    const select = screen.getByTestId('course-select');
    fireEvent.change(select, { target: { value: 'calculo' } });

    expect(screen.getByText('Média: 66.28571428571429')).toBeInTheDocument();
    expect(screen.getByText('Melhor: 86')).toBeInTheDocument();
    expect(screen.getByText('Última: 23')).toBeInTheDocument();

    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos: Prova 1,Prova 2,Prova 3');
  });

  it('deve atualizar os dados ao selecionar "Física Geral"', async () => {
    render(<DesempenhoPage />);

    
    await waitFor(() => expect(screen.getByText('Física Geral')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'fisica' },
    });

    
    expect(screen.getByText('Média: 83.8')).toBeInTheDocument();
    expect(screen.getByText('Melhor: 90')).toBeInTheDocument();
    expect(screen.getByText('Última: 77')).toBeInTheDocument();
  });

  it('deve voltar ao estado inicial ao selecionar "Nenhum" novamente', async () => {
    render(<DesempenhoPage />);
    await waitFor(() => expect(screen.getByText('Cálculo I')).toBeInTheDocument());

    
    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'calculo' },
    });
    expect(screen.getByText('Melhor: 86')).toBeInTheDocument();

    
    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'nenhum' },
    });

    expect(screen.getByText('Média: NaN')).toBeInTheDocument();
    expect(screen.getByText('Melhor: -Infinity')).toBeInTheDocument();
  });
});