import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisualizarProvaPage from '../src/app/(app)/cursos/[id]/provas/[provaId]/visualizar/page'; //src\app\(app)\cursos\[id]\provas\[provaId]\visualizar


const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({
    id: 'curso-123',
    provaId: 'prova-456',
  }),
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe('VisualizarProvaPage', () => {
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve exibir o estado de loading inicialmente', () => {
    render(<VisualizarProvaPage />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('deve carregar e exibir os dados da prova corretamente após o delay', async () => {
    render(<VisualizarProvaPage />);

    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    
    expect(screen.getByText('Prova 1 - Lógica de Programação')).toBeInTheDocument();
    expect(screen.getByText('Prof. Silva')).toBeInTheDocument();
    
    
    expect(screen.getByText('7.5 / 10.0')).toBeInTheDocument();
    
    
    expect(screen.getByText('O que é um algoritmo?')).toBeInTheDocument();
    expect(screen.getByText('Questão 1')).toBeInTheDocument();
  });

  it('deve exibir feedback visual de acerto e erro', async () => {
    render(<VisualizarProvaPage />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

   
    expect(screen.getAllByText('Resposta correta!')[0]).toBeInTheDocument();

    
    expect(screen.getAllByText('Resposta incorreta')[0]).toBeInTheDocument();
    
    
    expect(screen.getByText('Atenção ao operador de pós-incremento. O valor final é 11.')).toBeInTheDocument();
  });

  it('deve permitir abrir, preencher e enviar uma réplica', async () => {
    render(<VisualizarProvaPage />);

    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

   
    const botoesReplica = screen.getAllByText('Discordo desta correção');
    
    
    fireEvent.click(botoesReplica[0]);

    
    const inputsReplica = screen.getAllByPlaceholderText('Descreva seus argumentos de forma clara e respeitosa...');
    const inputReplica = inputsReplica[0];

    
    expect(inputReplica).toBeVisible();

    
    fireEvent.change(inputReplica, { target: { value: 'Professor, acredito que minha resposta está correta...' } });

    
    const botoesEnviar = screen.getAllByText('Enviar Réplica');
    const botaoEnviar = botoesEnviar[0];
    
    await act(async () => {
      fireEvent.click(botaoEnviar);
      
      jest.advanceTimersByTime(500);
    });

    
    expect(screen.getByText(/Sua Réplica.*Aguardando resposta/i)).toBeInTheDocument();
    expect(screen.getByText('Professor, acredito que minha resposta está correta...')).toBeInTheDocument();
  });

  it('deve navegar de volta ao clicar nos botões de voltar', async () => {
    render(<VisualizarProvaPage />);

    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    
    const botaoVoltarCurso = screen.getByText('Voltar ao Curso');
    fireEvent.click(botaoVoltarCurso);
    expect(mockPush).toHaveBeenCalledWith('/cursos/curso-123');

    
    const botaoVoltarFooter = screen.getByRole('button', { name: /voltar$/i }); 
    fireEvent.click(botaoVoltarFooter);
    expect(mockBack).toHaveBeenCalled();
  });
});