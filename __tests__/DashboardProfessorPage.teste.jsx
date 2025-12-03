import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DashboardPage from '../src/app/(app)/(professor)/dashboard/page'; 
import '@testing-library/jest-dom';


jest.mock('../src/app/components/ClassroomCard', () => {
  return function MockClassroomCard({ classroomTitle }) {
    return <div data-testid="classroom-card">{classroomTitle}</div>;
  };
});

jest.mock('../src/app/components/Calendar', () => {
  return function MockCalendar() {
    return <div data-testid="calendar">Calendar Component</div>;
  };
});


global.fetch = jest.fn();

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir o estado de carregamento inicialmente', async () => {
    
    global.fetch.mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('deve renderizar os cursos corretamente (Top 6 ordenados)', async () => {
    
    const mockCursos = {
      itens: [
        { id: 1, nome: 'Curso Baixo', questoesCount: 1 },
        { id: 2, nome: 'Curso Top 1', questoesCount: 100 },
        { id: 3, nome: 'Curso Top 2', questoesCount: 90 },
        { id: 4, nome: 'Curso Top 3', questoesCount: 80 },
        { id: 5, nome: 'Curso Top 4', questoesCount: 70 },
        { id: 6, nome: 'Curso Top 5', questoesCount: 60 },
        { id: 7, nome: 'Curso Top 6', questoesCount: 50 },
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCursos,
    });

    render(<DashboardPage />);

    
    expect(await screen.findByText('Curso Top 1')).toBeInTheDocument();

    expect(screen.queryByText('Curso Baixo')).not.toBeInTheDocument();

    const cards = screen.getAllByTestId('classroom-card');
    expect(cards).toHaveLength(6);
  });

  it('deve exibir mensagem de "Nenhum curso" quando a lista vier vazia', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ itens: [] }),
    });

    render(<DashboardPage />);


    expect(await screen.findByText('Nenhum curso cadastrado ainda.')).toBeInTheDocument();
    
    
    const createButton = screen.getByRole('button', { name: /Criar Primeiro Curso/i });
    expect(createButton).toBeInTheDocument();
    
    
    expect(createButton.closest('a')).toHaveAttribute('href', '/cursos/criar');
  });

  it('deve exibir mensagem de erro quando a API falhar', async () => {
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
    });

    render(<DashboardPage />);

    expect(await screen.findByText('Erro ao carregar cursos')).toBeInTheDocument();
  });

  it('deve sempre renderizar o componente de Agenda (Calendar)', async () => {
    
    global.fetch.mockRejectedValueOnce(new Error('Network Error'));

    render(<DashboardPage />);

    
    expect(await screen.findByText('Agenda')).toBeInTheDocument();
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });

  it('o botão "Ver todos" deve redirecionar para /cursos', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ itens: [] }),
    });

    render(<DashboardPage />);

    const verTodosBtn = await screen.findByText('Ver todos');
    expect(verTodosBtn.closest('a')).toHaveAttribute('href', '/cursos');
  });
});