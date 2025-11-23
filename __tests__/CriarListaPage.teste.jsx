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

global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true, 
      json: () => Promise.resolve({ message: 'Lista criada com sucesso' }),
    })
  );

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



// Encontra o Card que contém as listas de questões
const getQuestoesCard = () => {
  
  return screen.getByText('Questões da Lista').closest('.MuiCard-root');
};


const getSelecionadasList = (card) => {
  const heading = within(card).getByText(/Questões Selecionadas/);
  return heading.closest('div').nextSibling; 
};


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
    
    
    // Isso garante que os 'act' warnings desapareçam, pois esperamos a tela ficar estável.
    expect(await screen.findByText(mockQuestao1.enunciado)).toBeInTheDocument();
    expect(await screen.findByText(mockQuestao2.enunciado)).toBeInTheDocument();
    
    // Agora que a tela está estável, checamos os elementos síncronos.
    expect(screen.getByRole('heading', { name: /Criar Nova Lista de Exercícios/i })).toBeInTheDocument();
    expect(screen.getByText(/Curso: Cálculo I/i)).toBeInTheDocument();
    
    
    expect(screen.getByLabelText(/Conteúdo da Lista/i)).toHaveValue('');
    
    // Agora o loading não deve mais existir.
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('deve permitir ao usuário selecionar e remover questões', async () => {
    setupMocks(
      'curso123',
      'Cálculo I',
      { items: [mockQuestao1, mockQuestao2] }
    );
    render(<CriarListaPage />);
    
    
    await screen.findByText(mockQuestao1.enunciado);
    const questoesCard = getQuestoesCard();
    const disponiveisList = getDisponiveisList(questoesCard);

    
    fireEvent.click(within(disponiveisList).getByText(mockQuestao1.enunciado));

    
    await screen.findByText(/Questões Selecionadas \(1\)/); // Espera o contador atualizar
    const selecionadasList = getSelecionadasList(questoesCard);
    
    const q1Item = await within(selecionadasList).findByText(mockQuestao1.enunciado);
    expect(q1Item).toBeInTheDocument();
    
    expect(within(q1Item.closest('li')).getByText('1')).toBeInTheDocument();

    
    await waitFor(() => {
      expect(within(disponiveisList).queryByText(mockQuestao1.enunciado)).not.toBeInTheDocument();
    });

    
    const q1ListItem = q1Item.closest('li');
    
    const removeButton = within(q1ListItem).getByTestId('ClearIcon');
    fireEvent.click(removeButton);

    
    await waitFor(() => {
      expect(screen.queryByText(/Questões Selecionadas \(\d\)/)).not.toBeInTheDocument();
    });

    
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

    
    fireEvent.click(within(disponiveisList).getByText(mockQuestao1.enunciado));
    await screen.findByText(/Questões Selecionadas \(1\)/); 
    fireEvent.click(within(disponiveisList).getByText(mockQuestao2.enunciado));
    await screen.findByText(/Questões Selecionadas \(2\)/); 

    const selecionadasList = getSelecionadasList(questoesCard);
    
    let listItems = await within(selecionadasList).findAllByRole('listitem');

    
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

    
    fireEvent.change(screen.getByLabelText(/Conteúdo da Lista/i), { target: { value: ' ' } });
    
    const submitButton = screen.getByRole('button', { name: /Gravar Lista/i });
    fireEvent.click(submitButton);

    
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

    
    fireEvent.change(screen.getByLabelText(/Conteúdo da Lista/i), { target: { value: 'Lista Teste' } });
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

    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/cursos/curso123/listas', 
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            
            tituloLista: 'Lista Teste', 
            questoesIds: [mockQuestao2._id, mockQuestao1._id],
            nomeInstituicao: 'UNIFESP',
            usarPontuacao: false,
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

    
    fireEvent.change(screen.getByLabelText(/Conteúdo da Lista/i), { target: { value: 'Lista com erro' } });
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