import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ListarQuestoesPage from '../src/app/questoes/page'; 

// Mock dos dados que a API retornaria
const mockQuestoes = [
  {
    id: '1',
    enunciado: 'Qual é a capital do Brasil?',
    tipo: 'alternativa',
    alternativas: [
      { texto: 'São Paulo', correta: false },
      { texto: 'Brasília', correta: true },
    ],
  },
  {
    id: '2',
    enunciado: 'A Terra é plana?',
    tipo: 'vf',
    alternativas: [
        { texto: 'Verdadeiro', correta: false },
        { texto: 'Falso', correta: true },
    ],
  },
];

// Resetar os mocks antes de cada teste para garantir isolamento
beforeEach(() => {
  fetch.mockClear();
  confirm.mockClear();
  alert.mockClear(); 
});

describe('ListarQuestoesPage', () => {
  
  
  it('exibir o estado de carregamento inicialmente', () => {
    fetch.mockImplementation(() => new Promise(() => {}));
    render(<ListarQuestoesPage />);
    expect(screen.getByText(/carregando.../i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('exibir uma mensagem de erro se a busca falhar', async () => {
    fetch.mockRejectedValueOnce(new Error('Erro ao buscar questões'));
    render(<ListarQuestoesPage />);
    expect(await screen.findByText('Erro ao buscar questões')).toBeInTheDocument();
  });

  it('deve exibir uma mensagem quando nenhuma questão for encontrada', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });
    render(<ListarQuestoesPage />);
    expect(await screen.findByText('Nenhuma questão cadastrada.')).toBeInTheDocument();
  });

  it('renderizar a lista de questões com sucesso', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockQuestoes }),
    });
    render(<ListarQuestoesPage />);
    expect(await screen.findByText('Qual é a capital do Brasil?')).toBeInTheDocument();
    expect(screen.getByText('A Terra é plana?')).toBeInTheDocument();
    expect(screen.getByText('Brasília (Correta)')).toBeInTheDocument();
  });


  it('excluir uma questão após a confirmação', async () => {
    // Setup
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockQuestoes }),
    });
    fetch.mockResolvedValueOnce({ 
        ok: true,
        json: async () => ({ message: 'Questão excluída com sucesso' })
     });
    
    confirm.mockReturnValueOnce(true);

    render(<ListarQuestoesPage />);

    // Find elements
    const card = await screen.findByText('Qual é a capital do Brasil?');
    const parentCard = card.closest('.MuiCard-root');
    const deleteButton = within(parentCard).getByRole('button', { name: /excluir/i });
    
    // Act: User clicks the delete button
    fireEvent.click(deleteButton);

    // Assert: Check that the confirmation dialog was shown
    expect(confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta questão? A ação não poderá ser desfeita');
    
    // THE FIX: Wait for the user-visible result to happen.
    // This waits until the question is no longer on the screen.
    await waitFor(() => {
      expect(screen.queryByText('Qual é a capital do Brasil?')).not.toBeInTheDocument();
    });

    // Assert side-effects: Now that the UI is updated, check if the API calls happened.
    expect(fetch).toHaveBeenCalledWith('/api/questoes/1', { method: 'DELETE' });
    expect(alert).toHaveBeenCalledWith('Questão excluída com sucesso');
  });

  it('abrir o modal de edição quando o botão de editar for clicado', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockQuestoes }),
    });

    render(<ListarQuestoesPage />);

    const enunciado = await screen.findByText('Qual é a capital do Brasil?');
    const parentCard = enunciado.closest('.MuiCard-root');
    const editButton = within(parentCard).getByRole('button', { name: /editar/i });

    fireEvent.click(editButton);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Editar Questão')).toBeInTheDocument();
  });
});