import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisualizarProvaPage from '../src/app/(app)/cursos/[id]/provas/[provaId]/visualizar/page';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockFetch = jest.fn();
const originalFetch = global.fetch;

const mockResultado = {
  prova: {
    titulo: 'Prova 1 - Lógica de Programação',
    data: '2024-05-10T12:00:00.000Z',
    valorTotal: 10,
    professor: 'Prof. Silva',
    instrucoes: 'Responda às questões com atenção.',
  },
  desempenho: {
    nota: 7.5,
    aprovado: true,
    dataEntrega: '2024-05-11T12:00:00.000Z',
  },
  questoes: [
    {
      id: 'q1',
      numero: 1,
      enunciado: 'O que é um algoritmo?',
      tipo: 'discursiva',
      valor: 5,
      notaObtida: 5,
      respostaAluno: 'Sequência de passos finita para resolver um problema.',
      respostaCorreta: 'Sequência de passos para resolver um problema.',
      feedback: 'Boa resposta, mas poderia detalhar mais.',
    },
    {
      id: 'q2',
      numero: 2,
      enunciado: 'Quanto é 5 + 7?',
      tipo: 'alternativa',
      valor: 5,
      notaObtida: 2,
      respostaAluno: 'B',
      respostaCorreta: 'C',
      feedback: 'Revise a soma básica.',
      alternativas: [
        { letra: 'A', texto: '10' },
        { letra: 'B', texto: '11' },
        { letra: 'C', texto: '12' },
        { letra: 'D', texto: '13' },
      ],
    },
  ],
};

const mockApiResponse = (data) => ({
  ok: true,
  json: async () => data,
});

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
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue(mockApiResponse(mockResultado));
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  const renderPage = () => render(<VisualizarProvaPage />);

  it('mostra indicador de carregamento enquanto a busca não finaliza', async () => {
    let resolveFetch;
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderPage();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    act(() => {
      resolveFetch(mockApiResponse(mockResultado));
    });

    await screen.findByText('Prova 1 - Lógica de Programação');
  });

  it('exibe dados da prova e das questões após o carregamento', async () => {
    renderPage();

    await screen.findByText('Prova 1 - Lógica de Programação');

    expect(mockFetch).toHaveBeenCalledWith('/api/cursos/curso-123/provas/prova-456/resultado');
    expect(screen.getByText('Prof. Silva')).toBeInTheDocument();
    expect(screen.getByText('7.5 / 10.0')).toBeInTheDocument();
    expect(screen.getByText('Questão 1')).toBeInTheDocument();
    expect(screen.getByText('Questão 2')).toBeInTheDocument();
    expect(screen.getByText('Resposta correta!')).toBeInTheDocument();
    expect(screen.getByText('Resposta incorreta')).toBeInTheDocument();
  });

  it('permite abrir, preencher e enviar uma réplica', async () => {
    renderPage();

    await screen.findByText('Prova 1 - Lógica de Programação');

    const botoesReplica = screen.getAllByText('Discordo desta correção');
    const botaoReplicaPrimeiraQuestao = botoesReplica[0];
    fireEvent.click(botaoReplicaPrimeiraQuestao);

    const inputReplica = screen.getAllByPlaceholderText(
      'Descreva seus argumentos de forma clara e respeitosa...'
    )[0];
    fireEvent.change(inputReplica, {
      target: { value: 'Professor, acredito que minha resposta está correta.' },
    });

    const botaoEnviar = screen.getAllByText('Enviar Réplica')[0];

    await act(async () => {
      fireEvent.click(botaoEnviar);
      jest.advanceTimersByTime(500);
    });

    await screen.findByText(/Sua Réplica \(Aguardando resposta\):/i);
    expect(screen.getByText('Professor, acredito que minha resposta está correta.')).toBeInTheDocument();
  });

  it('navega corretamente pelos botões de voltar', async () => {
    renderPage();

    await screen.findByText('Prova 1 - Lógica de Programação');

    fireEvent.click(screen.getByText('Voltar ao Curso'));
    expect(mockPush).toHaveBeenCalledWith('/cursos/curso-123');

    fireEvent.click(screen.getByRole('button', { name: /^Voltar$/ }));
    expect(mockBack).toHaveBeenCalled();
  });
});