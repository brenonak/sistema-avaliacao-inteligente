import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DesempenhoPage from '../src/app/(app)/desempenho/page';

jest.mock('../src/app/components/StudentPerformanceChart', () => {
  return function DummyChart({ text }) {
    return <div data-testid="mock-chart">{text}</div>;
  };
});


jest.mock('../src/app/components/CourseSelect', () => {
  return function DummySelect({ courses, selectedCourse, onCourseChange }) {
    return (
      <select
        data-testid="course-select"
        value={selectedCourse}
        onChange={(e) => onCourseChange(e.target.value)}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    );
  };
});


global.fetch = jest.fn();

const mockData = {
  cursos: [
    { id: 'math101', nome: 'Matemática' },
    { id: 'phys202', nome: 'Física' }
  ],
  graficosPorCurso: {
    math101: {
      examsLabels: ['P1'], examsScores: [80],
      listsLabels: [], listsScores: [],
      combinedLabels: ['P1', 'L1'],
      combinedScores: [80, 100] 
    },
    phys202: {
      examsLabels: [], examsScores: [],
      listsLabels: [], listsScores: [],
      combinedLabels: [], 
      combinedScores: [50] 
    }
  }
};

describe('Integração - DesempenhoPage', () => {
  beforeEach(() => {
    fetch.mockClear();
    
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
  });

  it('deve carregar os dados da API e atualizar o resumo ao trocar de curso', async () => {
    render(<DesempenhoPage />);

    
    expect(screen.getByText('Desempenho')).toBeInTheDocument();
    
    
    expect(fetch).toHaveBeenCalledWith('/api/desempenho');

    
    const optionMath = await screen.findByText('Matemática');
    expect(optionMath).toBeInTheDocument();

    
    const select = screen.getByTestId('course-select');
    fireEvent.change(select, { target: { value: 'math101' } });

    
    
    await waitFor(() => {
      
      expect(screen.getByText('90.0')).toBeInTheDocument(); 
      
      
      const hundreds = screen.getAllByText('100.0');
      expect(hundreds).toHaveLength(2);
    });

    
    expect(screen.getByText('Provas')).toBeInTheDocument(); 
  });
});