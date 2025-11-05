import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CriarListaPage from '../src/app/(app)/listas/criar/page'; 

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
    // [MODIFICADO] Endpoint de submissão alterado para /listas
    if (url.includes(`/api/cursos/${cursoId}/listas`) && submitResponse) {
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

// --- Helpers de Seleção (adaptados do seu teste de Prova) ---

// Encontra o Card que contém as listas de questões
const getQuestoesCard = () => {
  // [MODIFICADO] Texto do título do Card
  return screen.getByText('Questões da Lista').closest('.MuiCard-root');
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

describe('CriarListaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it('deve renderizar, carregar questões e preencher nome da matéria do curso', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1, mockQuestao2] }
    );
    render(<CriarListaPage />);
    
    // Verifica cabeçalho
    expect(screen.getByRole('heading', { name: /Criar Nova Lista de Exercícios/i })).toBeInTheDocument();
    expect(screen.getByText(/Curso: Cálculo I/i)).toBeInTheDocument();
    
    // [MODIFICADO] Verifica se o nome da matéria foi preenchido automaticamente
    expect(screen.getByLabelText(/Nome da Matéria/i)).toHaveValue('Cálculo I');
    
    // Verifica loading
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Espera as questões carregarem
    expect(await screen.findByText(mockQuestao1.enunciado)).toBeInTheDocument();
    expect(await screen.findByText(mockQuestao2.enunciado)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('deve permitir ao usuário selecionar e remover questões', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1, mockQuestao2] }
    );
    render(<CriarListaPage />);
    
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
    // [MODIFICADO] Verifica se o número da ordem (1) está visível
    expect(within(q1Item.closest('li')).getByText('1')).toBeInTheDocument();

    // 4. ESPERA ela desaparecer da lista de "Disponíveis"
    await waitFor(() => {
      expect(within(disponiveisList).queryByText(mockQuestao1.enunciado)).not.toBeInTheDocument();
    });

    // --- 5. Remover a Questão 1 ---
    const q1ListItem = q1Item.closest('li');
    // Usando getByTestId no ícone, assim como no seu teste de referência
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
    render(<CriarListaPage />);
    await screen.findByText(mockQuestao1.enunciado); // Espera carregar
    
    const questoesCard = getQuestoesCard();
    const disponiveisList = getDisponiveisList(questoesCard);

    // Seleciona as duas questões (Q1, depois Q2)
    fireEvent.click(within(disponiveisList).getByText(mockQuestao1.enunciado));
    await screen.findByText(/Questões Selecionadas \(1\)/); 
    fireEvent.click(within(disponiveisList).getByText(mockQuestao2.enunciado));
    await screen.findByText(/Questões Selecionadas \(2\)/); 

    const selecionadasList = getSelecionadasList(questoesCard);
    
    let listItems = await within(selecionadasList).findAllByRole('listitem');

    // Ordem inicial: [Q1, Q2]
    expect(within(listItems[0]).getByText(mockQuestao1.enunciado)).toBeInTheDocument();
    expect(within(listItems[1]).getByText(mockQuestao2.enunciado)).toBeInTheDocument();

    // --- Mover Q2 para Cima ---
    const moveUpButtonQ2 = within(listItems[1]).getByTestId('ArrowUpwardIcon');
    fireEvent.click(moveUpButtonQ2);

    // Ordem nova: [Q2, Q1]
    listItems = within(selecionadasList).getAllByRole('listitem');
    expect(within(listItems[0]).getByText(mockQuestao2.enunciado)).toBeInTheDocument();
    expect(within(listItems[1]).getByText(mockQuestao1.enunciado)).toBeInTheDocument();

    // --- Mover Q2 (agora item 0) para Baixo ---
    const moveDownButtonQ2 = within(listItems[0]).getByTestId('ArrowDownwardIcon');
    fireEvent.click(moveDownButtonQ2);

    // Ordem nova: [Q1, Q2]
    listItems = within(selecionadasList).getAllByRole('listitem');
    expect(within(listItems[0]).getByText(mockQuestao1.enunciado)).toBeInTheDocument();
    expect(within(listItems[1]).getByText(mockQuestao2.enunciado)).toBeInTheDocument();
  });

  it('deve mostrar um erro de validação se o nome da matéria não for preenchido', async () => {
    setupMocks('curso123', 'Cálculo I', { items: [] });
    render(<CriarListaPage />);

    // [MODIFICADO] Apaga o valor pré-preenchido
    fireEvent.change(screen.getByLabelText(/Nome da Matéria/i), { target: { value: ' ' } });
    
    const submitButton = screen.getByRole('button', { name: /Gravar Lista/i });
    fireEvent.click(submitButton);

    // [MODIFICADO] Mensagem de erro específica da Lista
    const alertText = await screen.findByText(/O nome da matéria é obrigatório/i);
    expect(alertText).toBeInTheDocument();
    
    expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/listas'), // Verifica se não chamou o endpoint de /listas
        expect.any(Object)
    );
  });

  it('deve submeter o formulário com sucesso e redirecionar', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1, mockQuestao2] },
      { ok: true, data: { message: 'Sucesso' } }
    );
    render(<CriarListaPage />);
    await screen.findByText(mockQuestao1.enunciado); // Espera carregar

    // Preenche o formulário
    fireEvent.change(screen.getByLabelText(/Nome da Matéria/i), { target: { value: 'Lista Teste' } });
    fireEvent.change(screen.getByLabelText(/Nome da Escola\/Instituição/i), { target: { value: 'UNIFESP' } });
    
    // Seleciona questões (Q2 e depois Q1, para testar a ordem de submissão)
    const questoesCard = getQuestoesCard();
    const disponiveisList = getDisponiveisList(questoesCard);
    fireEvent.click(within(disponiveisList).getByText(mockQuestao2.enunciado));
    await screen.findByText(/Questões Selecionadas \(1\)/);
    fireEvent.click(within(disponiveisList).getByText(mockQuestao1.enunciado));
    await screen.findByText(/Questões Selecionadas \(2\)/);
    
    // Submete o formulário
    const submitButton = screen.getByRole('button', { name: /Gravar Lista/i });
    fireEvent.click(submitButton);

    // Verifica o estado de loading
    expect(await screen.findByRole('button', { name: /Gravando Lista.../i })).toBeDisabled();

    // [MODIFICADO] Verifica a chamada ao fetch com os dados da LISTA
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/cursos/curso123/listas', // Endpoint correto
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            nomeMateria: 'Lista Teste',
            questoesIds: [mockQuestao2._id, mockQuestao1._id],
            nomeInstituicao: 'UNIFESP',
            // A ordem de seleção foi Q2, depois Q1.
             
          }),
        })
      );
    });

    // Verifica a mensagem de sucesso e o redirecionamento
    expect(await screen.findByText(/Lista salva com sucesso!/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/cursos/curso123');
    });
  });

  it('deve mostrar uma mensagem de erro se a API de submissão falhar', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1] },
      { ok: false, data: { message: 'Erro interno do servidor' } } 
    );
    render(<CriarListaPage />);
    await screen.findByText(mockQuestao1.enunciado);

    // Preenche dados mínimos
    fireEvent.change(screen.getByLabelText(/Nome da Matéria/i), { target: { value: 'Lista com erro' } });
    fireEvent.click(screen.getByText(mockQuestao1.enunciado));
    await screen.findByText(/Questões Selecionadas \(1\)/);
    
    // Submete
    fireEvent.click(screen.getByRole('button', { name: /Gravar Lista/i }));

    // Verifica o erro
    expect(await screen.findByText(/Erro interno do servidor/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gravar Lista/i })).not.toBeDisabled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});