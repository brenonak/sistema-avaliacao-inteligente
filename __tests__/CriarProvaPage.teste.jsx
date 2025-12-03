import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CriarProvaPage from '../src/app/(app)/(professor)/provas/page'; 

// --- Mocks Globais ---

const mockRouter = {
  push: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: jest.fn(),
}));

global.fetch = jest.fn();

// --- Dados Mockados ---

const mockQuestao1 = {
  _id: 'id_questao_1',
  enunciado: 'Quanto é 2 + 2?',
  tipo: 'Dissertativa',
  tags: ['matemática', 'fácil'],
};

const mockQuestao2 = {
  _id: 'id_questao_2',
  enunciado: 'Qual a capital do Brasil?',
  tipo: 'Múltipla Escolha',
  tags: ['geografia'],
};

// Helper para configurar os mocks
const setupMocks = (cursoId, cursoNome, questoesResponse, submitResponse) => {
  require('next/navigation').useSearchParams.mockReturnValue({
    get: (key) => {
      if (key === 'cursoId') return cursoId;
      if (key === 'cursoNome') return cursoNome ? encodeURIComponent(cursoNome) : null;
      return null;
    },
  });

  fetch.mockImplementation((url) => {
    if (url.includes(`/api/cursos/${cursoId}/questoes`)) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(questoesResponse),
      });
    }
    if (url.includes(`/api/cursos/${cursoId}/provas`) && submitResponse) {
      return new Promise(resolve => {
        setTimeout(() => {
            if (submitResponse.ok) {
                resolve({
                    ok: true,
                    json: () => Promise.resolve(submitResponse.data),
                });
            } else {
                resolve({
                    ok: false,
                    json: () => Promise.resolve(submitResponse.data),
                });
            }
        }, 50)
      })  
    }
    return Promise.reject(new Error(`URL não mockada: ${url}`));
  });
};



// Encontra o Card que contém as listas de questões
const getQuestoesCard = () => {
  return screen.getByText('Questões da Prova').closest('.MuiCard-root');
};

// Encontra a LISTA de questões selecionadas (que vem DEPOIS do título)
const getSelecionadasList = (card) => {
  const heading = within(card).getByText(/Questões Selecionadas/);
  return heading.closest('div').nextSibling; // A <List> é o próximo irmão da <Box> do título
};

// Encontra a LISTA de questões disponíveis (a última <List> dentro do Card)
const getDisponiveisList = (card) => {
  const lists = within(card).getAllByRole('list');
  return lists[lists.length - 1]; // A lista de disponíveis é sempre a última
};

// --- Testes ---

describe('CriarProvaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a página, carregar e exibir as questões disponíveis', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1, mockQuestao2] }
    );
    render(<CriarProvaPage />);
    expect(screen.getByRole('heading', { name: /Criar Nova Prova/i })).toBeInTheDocument();
    expect(screen.getByText(/Curso: Cálculo I/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Disciplina/i)).toHaveValue('Cálculo I');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Espera as questões carregarem
    expect(await screen.findByText(mockQuestao1.enunciado)).toBeInTheDocument();
    expect(await screen.findByText(mockQuestao2.enunciado)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('deve permitir ao usuário selecionar, remover e definir pontuação para questões', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1, mockQuestao2] }
    );
    render(<CriarProvaPage />);
    
    // 1. Espera as questões carregarem e acha o Card
    await screen.findByText(mockQuestao1.enunciado);
    const questoesCard = getQuestoesCard();
    const disponiveisList = getDisponiveisList(questoesCard);

    // --- 2. Selecionar a Questão 1 ---
    fireEvent.click(within(disponiveisList).getByText(mockQuestao1.enunciado));

    // 3. ESPERA ela aparecer na lista de "Selecionadas"
    await screen.findByText(/Questões Selecionadas \(1\)/); // Espera o contador atualizar
    const selecionadasList = getSelecionadasList(questoesCard);
    
    const q1Item = await within(selecionadasList).findByText(mockQuestao1.enunciado);
    expect(q1Item).toBeInTheDocument();

    // 4. ESPERA ela desaparecer da lista de "Disponíveis"
    await waitFor(() => {
      expect(within(disponiveisList).queryByText(mockQuestao1.enunciado)).not.toBeInTheDocument();
    });

    // --- 5. Definir pontuação ---
    const q1ListItem = q1Item.closest('li');
    const pontosInput = within(q1ListItem).getByLabelText(/Pontos/i);
    fireEvent.change(pontosInput, { target: { value: '2.5' } });
    
    expect(await screen.findByText(/2\.5 pts/)).toBeInTheDocument(); // Espera o total atualizar

    // --- 6. Remover a Questão 1 ---
    const removeButton = within(q1ListItem).getByTestId('ClearIcon');
    fireEvent.click(removeButton);

    // 7. ESPERA a seção "Questões Selecionadas" desaparecer
    await waitFor(() => {
      expect(screen.queryByText(/Questões Selecionadas \(\d\)/)).not.toBeInTheDocument();
    });

    // 8. ESPERA a Questão 1 voltar para a lista de "Disponíveis"
    expect(await within(disponiveisList).findByText(mockQuestao1.enunciado)).toBeInTheDocument();
  });

  it('deve permitir reordenar as questões selecionadas', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1, mockQuestao2] }
    );
    render(<CriarProvaPage />);
    await screen.findByText(mockQuestao1.enunciado); // Espera carregar
    
    const questoesCard = getQuestoesCard();
    const disponiveisList = getDisponiveisList(questoesCard);

    // Seleciona as duas questões
    fireEvent.click(within(disponiveisList).getByText(mockQuestao1.enunciado));
    await screen.findByText(/Questões Selecionadas \(1\)/); // Espera Q1 entrar
    fireEvent.click(within(disponiveisList).getByText(mockQuestao2.enunciado));
    await screen.findByText(/Questões Selecionadas \(2\)/); // Espera Q2 entrar

    const selecionadasList = getSelecionadasList(questoesCard);
    
    // ESPERA os 2 'listitem' aparecerem
    let listItems = await within(selecionadasList).findAllByRole('listitem');

    // Ordem inicial: [Q1, Q2]
    expect(within(listItems[0]).getByText(mockQuestao1.enunciado)).toBeInTheDocument();
    expect(within(listItems[1]).getByText(mockQuestao2.enunciado)).toBeInTheDocument();

    // --- Mover Q2 para Cima ---
    const moveUpButtonQ2 = within(listItems[1]).getByTestId('ArrowUpwardIcon');
    fireEvent.click(moveUpButtonQ2);

    // Ordem nova: [Q2, Q1]
    listItems = within(selecionadasList).getAllByRole('listitem'); // Agora pode ser síncrono
    expect(within(listItems[0]).getByText(mockQuestao2.enunciado)).toBeInTheDocument();
    expect(within(listItems[1]).getByText(mockQuestao1.enunciado)).toBeInTheDocument();
  });

  it('deve mostrar um erro de validação se o título não for preenchido', async () => {
    setupMocks('curso123', 'Cálculo I', { items: [] });
    render(<CriarProvaPage />);

    
    const submitButton = screen.getByRole('button', { name: /Gravar Prova/i });
    fireEvent.click(submitButton);

    
    const alertText = await screen.findByText(/O título da prova é obrigatório/i);
    expect(alertText).toBeInTheDocument();
    
    
    expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/provas'),
        expect.any(Object)
    );
  });

  it('deve submeter o formulário com sucesso e redirecionar', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1] },
      { ok: true, data: { message: 'Sucesso' } }
    );
    render(<CriarProvaPage />);
    await screen.findByText(mockQuestao1.enunciado); // Espera carregar

    // Preenche o formulário
    fireEvent.change(screen.getByLabelText(/Título da Prova/i), { target: { value: 'Prova Teste' } });
    fireEvent.change(screen.getByLabelText(/Instruções/i), { target: { value: 'Leia com atenção' } });
    fireEvent.change(screen.getByLabelText(/Nome da Escola/i), { target: { value: 'UNIFESP' } });
    fireEvent.change(screen.getByLabelText(/Nome do Professor/i), { target: { value: 'Prof. Teste' } });
    
    // <<< CORREÇÃO AQUI: Trocado 'change' por 'input'
    fireEvent.input(screen.getByLabelText(/Data/i), { target: { value: '2025-11-04' } });

    // Seleciona a questão
    const questoesCard = getQuestoesCard();
    const disponiveisList = getDisponiveisList(questoesCard);
    fireEvent.click(within(disponiveisList).getByText(mockQuestao1.enunciado));

    // ESPERA ela aparecer na lista de "Selecionadas" e define pontos
    await screen.findByText(/Questões Selecionadas \(1\)/);
    const selecionadasList = getSelecionadasList(questoesCard);
    const q1Item = await within(selecionadasList).findByText(mockQuestao1.enunciado);
    const q1ListItem = q1Item.closest('li');

    fireEvent.change(within(q1ListItem).getByLabelText(/Pontos/i), { target: { value: '10' } });

    // Submete o formulário
    const submitButton = screen.getByRole('button', { name: /Gravar Prova/i });
    fireEvent.click(submitButton);

    // Verifica o estado de loading e a chamada ao fetch
    expect(await screen.findByRole('button', { name: /Gravando Prova/i })).toBeDisabled();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/cursos/curso123/provas',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            titulo: 'Prova Teste',
            instrucoes: 'Leia com atenção',
            nomeEscola: 'UNIFESP',
            disciplina: 'Cálculo I',
            professor: 'Prof. Teste',
            data: '2025-11-04',
            duracao: '',
            valorTotal: '',
            observacoes: '',
            questoesSelecionadas: [mockQuestao1._id],
            questoesPontuacao: { [mockQuestao1._id]: 10 },
          }),
        })
      );
    });

    // Verifica a mensagem de sucesso e o redirecionamento
    expect(await screen.findByText(/Prova salva com sucesso!/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/cursos/curso123');
    });
  });

  it('deve mostrar uma mensagem de erro se a API de submissão falhar', async () => {
    // Suprime console.error para este teste, pois o erro é esperado
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1] },
      { ok: false, data: { message: 'Erro interno do servidor' } } 
    );
    render(<CriarProvaPage />);
    await screen.findByText(mockQuestao1.enunciado);

    fireEvent.change(screen.getByLabelText(/Título da Prova/i), { target: { value: 'Prova' } });
    fireEvent.change(screen.getByLabelText(/Instruções/i), { target: { value: 'Instruções' } });
    fireEvent.change(screen.getByLabelText(/Nome da Escola/i), { target: { value: 'Escola Teste' } });
    fireEvent.change(screen.getByLabelText(/Nome do Professor/i), { target: { value: 'Prof. Teste' } });
    
    
    fireEvent.input(screen.getByLabelText(/Data/i), { target: { value: '2025-11-04' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Gravar Prova/i }));

    expect(await screen.findByText(/Erro interno do servidor/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gravar Prova/i })).not.toBeDisabled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    
    // Restaura console.error
    consoleErrorSpy.mockRestore();
  });
});