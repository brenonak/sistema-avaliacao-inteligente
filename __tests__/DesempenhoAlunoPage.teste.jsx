import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import DesempenhoPage from '../src/app/(app)/(aluno)/aluno/desempenho/page';


jest.mock('../src/app/components/PerformanceSummary', () => {  //'../src/app/components/PerformanceSummary'
  return function MockPerformanceSummary({ average, best, latest }) {
    return (
      <div data-testid="performance-summary">
        Summary: Avg {average} / Best {best} / Latest {latest}
      </div>
    );
  };   
});

jest.mock('../src/app/components/StudentPerformanceChart', () => {
  return function MockChart({ text, scores }) {
    return (
      <div data-testid={`chart-${text.replace(/\s+/g, '-').toLowerCase()}`}>
        Chart: {text} - Count: {scores?.length || 0}
      </div>
    );
  };
});


jest.mock('../src/app/components/CourseSelect', () => {
  return function MockCourseSelect({ courses, onCourseChange }) {
    return (
      <div data-testid="course-select">
        <select onChange={(e) => onCourseChange(e.target.value)} data-testid="select-input">
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    );
  };
});


const mockApiData = {
  cursos: [
    { id: 'curso_1', nome: 'Engenharia de Software' },
    { id: 'curso_2', nome: 'Banco de Dados' }
  ],
  graficosPorCurso: {
    curso_1: {
      examsLabels: ['P1', 'P2'],
      examsScores: [8.0, 9.0],
      listsLabels: ['L1'],
      listsScores: [10.0],
      combinedLabels: ['L1', 'P1', 'P2'],
      combinedScores: [10.0, 8.0, 9.0], // Média: 9.0
      history: [
        {
          id: 'hist_1',
          title: 'Prova 1',
          type: 'Prova',
          date: '2023-10-01T00:00:00.000Z',
          score: 8.0,
          maxScore: 10.0,
          status: 'Corrigida'
        },
        {
          id: 'hist_2',
          title: 'Lista 1',
          type: 'Lista',
          date: '2023-09-15T00:00:00.000Z',
          score: 10.0,
          maxScore: 10.0,
          status: 'Entregue'
        }
      ]
    },
    
    curso_2: {
        examsLabels: [], examsScores: [], listsLabels: [], listsScores: [], combinedLabels: [], combinedScores: [], history: []
    }
  }
};

describe('DesempenhoPage', () => {
  
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiData),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o título da página corretamente', async () => {
    render(<DesempenhoPage />);
    
    expect(screen.getByRole('heading', { name: /Desempenho/i })).toBeInTheDocument();
  });

  it('deve buscar dados da API ao carregar a página', async () => {
    render(<DesempenhoPage />);

    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/desempenho');
    });
  });

  it('deve popular o CourseSelect com os cursos retornados pela API', async () => {
    render(<DesempenhoPage />);

    
    
    const curso1 = await screen.findByText('Engenharia de Software');
    expect(curso1).toBeInTheDocument();

    
    expect(screen.getByText('Banco de Dados')).toBeInTheDocument();
    expect(screen.getByText('Nenhum')).toBeInTheDocument();
  });

  it('deve exibir dados zerados ou padrão inicialmente (antes de selecionar curso)', async () => {
    render(<DesempenhoPage />);

    // Aguardar até que o loading desapareça e os dados sejam carregados
    await waitFor(() => {
      expect(screen.getByTestId('performance-summary')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('chart-provas')).toHaveTextContent('Count: 0');
  });

  it('deve atualizar os dados e mostrar a tabela de histórico ao selecionar um curso', async () => {
    render(<DesempenhoPage />);

    
    const selectElement = await screen.findByTestId('select-input');

    
    fireEvent.change(selectElement, { target: { value: 'curso_1' } });

    
    await waitFor(() => {
        expect(screen.getByTestId('performance-summary')).toHaveTextContent('Avg 9');
        expect(screen.getByTestId('performance-summary')).toHaveTextContent('Best 10');
    });

    
    const historyTitle = screen.getByText('Histórico de Avaliações');
    expect(historyTitle).toBeInTheDocument();

    
    expect(screen.getByText('Prova 1')).toBeInTheDocument();
    expect(screen.getByText('Lista 1')).toBeInTheDocument();
    
    
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
  });

  it('deve exibir o botão "Ver Correção" apenas para avaliações do tipo Prova', async () => {
    render(<DesempenhoPage />);

    const selectElement = await screen.findByTestId('select-input');
    fireEvent.change(selectElement, { target: { value: 'curso_1' } });

    
    await screen.findByText('Prova 1');

    
    const provaRow = screen.getByText('Prova 1').closest('tr');
    
    const botaoCorrecao = within(provaRow).getByRole('link', { name: /ver correção/i });
    expect(botaoCorrecao).toBeInTheDocument();
    expect(botaoCorrecao).toHaveAttribute('href', '/aluno/cursos/curso_1/provas/hist_1/resultado');

    
    const listaRow = screen.getByText('Lista 1').closest('tr');
    
    const botaoCorrecaoLista = within(listaRow).queryByRole('link', { name: /ver correção/i });
    expect(botaoCorrecaoLista).not.toBeInTheDocument();
  });

  it('não deve mostrar a tabela de histórico se o curso selecionado for "nenhum"', async () => {
    render(<DesempenhoPage />);
    
    
    await screen.findByTestId('select-input');

    
    expect(screen.queryByText('Histórico de Avaliações')).not.toBeInTheDocument();
  });
});