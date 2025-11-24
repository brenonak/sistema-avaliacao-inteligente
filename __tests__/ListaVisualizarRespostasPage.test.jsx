import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisualizarRespostasPage from '../src/app/(app)/(professor)/cursos/[id]/listas/[listaId]/visualizar/page';

// --- Mocks Globais ---

const mockRouter = {
  push: jest.fn(),
};

const mockParams = {
  id: 'curso123',
  listaId: 'lista456',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => mockParams,
}));

global.fetch = jest.fn();

// --- Dados Mockados ---

const mockListaFinalizada = {
  _id: 'lista456',
  tituloLista: 'Lista de Matemática Básica',
  nomeInstituicao: 'UNIFESP',
  usarPontuacao: true,
  questoes: [
    {
      id: 'q1',
      enunciado: 'Quanto é 2 + 2?',
      tipo: 'alternativa',
      pontuacao: 10,
      alternativas: [
        { letra: 'A', texto: '3' },
        { letra: 'B', texto: '4' },
        { letra: 'C', texto: '5' },
      ],
    },
    {
      id: 'q2',
      enunciado: 'Quanto é 5 x 3?',
      tipo: 'numerica',
      pontuacao: 5,
      margemErro: 0,
    },
  ],
};

const mockRespostasFinalizadas = {
  respostas: {
    q1: 'B',
    q2: 15,
  },
  correcao: {
    q1: {
      isCorrect: true,
      pontuacaoObtida: 10,
      pontuacaoMaxima: 10,
    },
    q2: {
      isCorrect: true,
      pontuacaoObtida: 5,
      pontuacaoMaxima: 5,
    },
  },
  finalizado: true,
  dataFinalizacao: '2025-11-20T10:00:00.000Z',
  pontuacaoTotal: 15,
  pontuacaoObtidaTotal: 15,
};

const mockListaNaoFinalizada = {
  _id: 'lista789',
  tituloLista: 'Lista de Geografia',
  nomeInstituicao: 'UNIFESP',
  usarPontuacao: true,
  questoes: [
    {
      id: 'q3',
      enunciado: 'Qual a capital do Brasil?',
      tipo: 'dissertativa',
      pontuacao: 10,
    },
  ],
};

const mockRespostasNaoFinalizadas = {
  respostas: {
    q3: 'Brasília',
  },
  correcao: {},
  finalizado: false,
  dataFinalizacao: null,
  pontuacaoTotal: 0,
  pontuacaoObtidaTotal: 0,
};

// --- Testes ---

describe('VisualizarRespostasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  test('deve exibir lista finalizada com correção e pontuação completa', async () => {
    // Configurar mocks
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockListaFinalizada,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRespostasFinalizadas,
      });

    render(<VisualizarRespostasPage />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verificar chamadas de API
    expect(fetch).toHaveBeenCalledWith('/api/cursos/curso123/listas/lista456');
    expect(fetch).toHaveBeenCalledWith('/api/cursos/curso123/listas/lista456/respostas');

    // Verificar título da lista
    expect(screen.getByText('Lista de Matemática Básica')).toBeInTheDocument();
    expect(screen.getByText('UNIFESP')).toBeInTheDocument();

    // Verificar badge de finalizado
    expect(screen.getByText('Finalizado')).toBeInTheDocument();

    // Verificar data de finalização
    expect(screen.getByText(/Respostas finalizadas em/)).toBeInTheDocument();

    // Verificar resumo de desempenho
    expect(screen.getByText('📊 Resultado')).toBeInTheDocument();
    expect(screen.getByText('15.0 / 15.0')).toBeInTheDocument();
    expect(screen.getByText('(100%)')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    // Verificar questões exibidas
    expect(screen.getByText('Questão 1')).toBeInTheDocument();
    expect(screen.getByText('Quanto é 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('Resposta correta!')).toBeInTheDocument();

    expect(screen.getByText('Questão 2')).toBeInTheDocument();
    expect(screen.getByText('Quanto é 5 x 3?')).toBeInTheDocument();

    // Verificar alternativas da questão 1
    expect(screen.getByText(/A\) 3/)).toBeInTheDocument();
    expect(screen.getByText(/B\) 4/)).toBeInTheDocument();
    expect(screen.getByText(/C\) 5/)).toBeInTheDocument();

    // Verificar resposta numérica da questão 2
    expect(screen.getByText('Resposta: 15')).toBeInTheDocument();

    // Verificar chips de pontuação
    expect(screen.getByText('10 pts')).toBeInTheDocument();
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getByText('10 / 10 pts')).toBeInTheDocument();
    expect(screen.getByText('5 / 5 pts')).toBeInTheDocument();
  });

  test('deve exibir lista não finalizada sem correção', async () => {
    // Configurar mocks
    mockParams.listaId = 'lista789';
    
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockListaNaoFinalizada,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRespostasNaoFinalizadas,
      });

    render(<VisualizarRespostasPage />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verificar chamadas de API
    expect(fetch).toHaveBeenCalledWith('/api/cursos/curso123/listas/lista789');
    expect(fetch).toHaveBeenCalledWith('/api/cursos/curso123/listas/lista789/respostas');

    // Verificar título da lista
    expect(screen.getByText('Lista de Geografia')).toBeInTheDocument();

    // NÃO deve exibir badge de finalizado
    expect(screen.queryByText('Finalizado')).not.toBeInTheDocument();

    // NÃO deve exibir data de finalização
    expect(screen.queryByText(/Respostas finalizadas em/)).not.toBeInTheDocument();

    // NÃO deve exibir resumo de desempenho
    expect(screen.queryByText('📊 Resultado')).not.toBeInTheDocument();

    // Verificar questão exibida
    expect(screen.getByText('Questão 1')).toBeInTheDocument();
    expect(screen.getByText('Qual a capital do Brasil?')).toBeInTheDocument();

    // NÃO deve exibir correção
    expect(screen.queryByText('Resposta correta!')).not.toBeInTheDocument();
    expect(screen.queryByText('Resposta incorreta')).not.toBeInTheDocument();

    // Verificar resposta dissertativa
    expect(screen.getByText('Sua resposta:')).toBeInTheDocument();
    expect(screen.getByText('Brasília')).toBeInTheDocument();

    // Verificar chip de pontuação (sem resultado)
    expect(screen.getByText('10 pts')).toBeInTheDocument();
    
    // NÃO deve exibir pontuação obtida
    expect(screen.queryByText(/10 \/ 10 pts/)).not.toBeInTheDocument();
  });
});
