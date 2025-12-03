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
    global.fetch = jest.fn((url) => {
      if (url === '/api/cursos') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ itens: mockApiResponse.cursos }),
        });
      }
      
      if (url === '/api/cursos/calculo') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            provas: [
              { _id: '1', titulo: 'Prova 1', valorTotal: 68, data: '2024-01-01' },
              { _id: '2', titulo: 'Prova 2', valorTotal: 74, data: '2024-02-01' },
              { _id: '3', titulo: 'Prova 3', valorTotal: 80, data: '2024-03-01' },
            ],
            exercicios: [
              { _id: '4', tituloLista: 'Lista 1', usarPontuacao: true, questoes: [{ pontuacao: 82 }] },
              { _id: '5', tituloLista: 'Lista 2', usarPontuacao: true, questoes: [{ pontuacao: 86 }] },
              { _id: '6', tituloLista: 'Lista 3', usarPontuacao: true, questoes: [{ pontuacao: 51 }] },
              { _id: '7', tituloLista: 'Lista 4', usarPontuacao: true, questoes: [{ pontuacao: 23 }] },
            ],
          }),
        });
      }
      
      if (url === '/api/cursos/fisica') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            provas: [
              { _id: '8', titulo: 'Prova 1', valorTotal: 79, data: '2024-01-01' },
              { _id: '9', titulo: 'Prova 2', valorTotal: 85, data: '2024-02-01' },
              { _id: '10', titulo: 'Prova 3', valorTotal: 77, data: '2024-03-01' },
            ],
            exercicios: [
              { _id: '11', tituloLista: 'Lista 1', usarPontuacao: true, questoes: [{ pontuacao: 90 }] },
              { _id: '12', tituloLista: 'Lista 2', usarPontuacao: true, questoes: [{ pontuacao: 88 }] },
            ],
          }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('deve renderizar o estado inicial corretamente (nenhum curso selecionado)', async () => {
    render(<DesempenhoPage />);
    
    
    await waitFor(() => expect(screen.getByText('Cálculo I')).toBeInTheDocument());

    const select = screen.getByTestId('course-select');
    expect(select).toHaveValue('nenhum');

    expect(screen.getByText('Média: 0')).toBeInTheDocument();
    expect(screen.getByText('Melhor: 0')).toBeInTheDocument();
    expect(screen.getByText('Última: 0')).toBeInTheDocument();
  });

  it('deve atualizar os dados ao selecionar "Cálculo I"', async () => {
    render(<DesempenhoPage />);
    
    
    await waitFor(() => expect(screen.getByText('Cálculo I')).toBeInTheDocument());

    const select = screen.getByTestId('course-select');
    fireEvent.change(select, { target: { value: 'calculo' } });

    await waitFor(() => {
      expect(screen.getByText('Média: 66.28571428571429')).toBeInTheDocument();
      expect(screen.getByText('Melhor: 86')).toBeInTheDocument();
      expect(screen.getByText('Última: 23')).toBeInTheDocument();
    });

    const provasChart = screen.getByTestId('chart-Provas');
    expect(provasChart).toHaveTextContent('Rótulos: Prova 1,Prova 2,Prova 3');
  });

  it('deve atualizar os dados ao selecionar "Física Geral"', async () => {
    render(<DesempenhoPage />);

    
    await waitFor(() => expect(screen.getByText('Física Geral')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'fisica' },
    });

    
    await waitFor(() => {
      expect(screen.getByText('Média: 83.8')).toBeInTheDocument();
      expect(screen.getByText('Melhor: 90')).toBeInTheDocument();
      expect(screen.getByText('Última: 88')).toBeInTheDocument();
    });
  });

  it('deve voltar ao estado inicial ao selecionar "Nenhum" novamente', async () => {
    render(<DesempenhoPage />);
    await waitFor(() => expect(screen.getByText('Cálculo I')).toBeInTheDocument());

    
    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'calculo' },
    });
    
    await waitFor(() => {
      expect(screen.getByText('Melhor: 86')).toBeInTheDocument();
    });

    
    fireEvent.change(screen.getByTestId('course-select'), {
      target: { value: 'nenhum' },
    });

    await waitFor(() => {
      expect(screen.getByText('Média: 0')).toBeInTheDocument();
      expect(screen.getByText('Melhor: 0')).toBeInTheDocument();
    });
  });
});