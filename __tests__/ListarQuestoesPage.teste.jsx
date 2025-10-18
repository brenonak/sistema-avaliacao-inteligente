import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ListarQuestoesPage from '../src/app/questoes/page'; 
import { ok } from 'assert';
import { be } from 'zod/v4/locales';

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
    tags: ['geografia', 'brasil']
  },
  {
    id: '2',
    enunciado: 'A Terra é plana?',
    tipo: 'vf',
    alternativas: [
        { texto: 'Verdadeiro', correta: false },
        { texto: 'Falso', correta: true },
    ],
    tags: ['ciência']
  },
];

const theme = createTheme({
  palette: {
    accent: {
      main: '#ff5722', // Pode ser qualquer cor, só precisa existir
    },
    success: {
        main: '#4caf50',
    },
    text: {
        primary: '#000000',
        secondary: '#666666'
    }
  },
});

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

// Mock do componente EditQuestionModal
jest.mock('../src/app/components/EditQuestionModal', () => {
  return function MockEditQuestionModal({ open, onClose, question, onSaveSuccess }) {
    if (!open) return null;
    const handleSimulateSave = () => {
      const updatedQuestion = { ...question, enunciado: 'Qual é a capital do Brasil? (Editado)' };
      onSaveSuccess(updatedQuestion);
      onClose();
    };
    return (
      <div role="dialog">
        <h1>Editar Questão</h1>
        <p>{question.enunciado}</p>
        <button onClick={handleSimulateSave}>Salvar Simulado</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    );
  };
});

// Resetar os mocks antes de cada teste
beforeEach(() => {
  fetch.mockClear();
  
  global.alert = jest.fn();
  
  // Mock para a funcionalidade de download
  global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
  global.URL.revokeObjectURL = jest.fn();
});

describe('ListarQuestoesPage', () => {
  
  it('deve exibir o estado de carregamento inicialmente', () => {
    fetch.mockImplementation(() => new Promise(() => {})); 
    renderWithTheme(<ListarQuestoesPage />);
    expect(screen.getByText(/carregando.../i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('deve exibir uma mensagem de erro se a busca de questões falhar', async () => {
    // Mock da requisição de tags
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: [] }),
    });
    
    // Mock da requisição de questões que falha
    fetch.mockRejectedValueOnce(new Error('Erro ao buscar questões'));
    
    renderWithTheme(<ListarQuestoesPage />);
    
    // Aguarda o erro ser exibido
    await waitFor(() => {
      expect(screen.getByText(/Erro ao buscar questões/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve exibir uma mensagem quando nenhuma questão for encontrada', async () => {
    // Mock da requisição de tags
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: [] }),
    });
    
    // Mock da requisição de questões vazia
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], total: 0 }),
    });
    
    renderWithTheme(<ListarQuestoesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Nenhuma questão cadastrada.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve renderizar a lista de questões com sucesso', async () => {
    // Mock da requisição de tags
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: ['geografia', 'brasil', 'ciência'] }),
    });
    
    // Mock da requisição de questões
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }),
    });
    
    renderWithTheme(<ListarQuestoesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText('A Terra é plana?')).toBeInTheDocument();
    expect(screen.getByText(/Brasília.*Correta/i)).toBeInTheDocument();
  });

 describe('Funcionalidade de Exclusão', () => {

  it('deve excluir uma questão com sucesso após a confirmação do usuário', async () => {
    const user = userEvent.setup();
    
    // Mock da requisição de tags
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: ['geografia', 'brasil'] }),
    });
    
    // Mock da requisição inicial de questões
    fetch.mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) 
    });
    
    // Mock da requisição de exclusão
    fetch.mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ message: 'Questão excluída' }) 
    });
    
    renderWithTheme(<ListarQuestoesPage />);
    
    // Aguarda a questão ser renderizada
    await waitFor(() => {
      expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Encontra o botão "Excluir" no card
    const card = screen.getByText('Qual é a capital do Brasil?');
    const deleteButtonOnCard = within(card.closest('.MuiCard-root')).getByRole('button', { name: /excluir/i });
    await user.click(deleteButtonOnCard);

    // Espera o diálogo aparecer
    const dialog = await screen.findByRole('dialog');
    
    // Usa getByRole e busca por "Excluir"
    const confirmButtonInDialog = within(dialog).getByRole('button', { name: /excluir/i });
    await user.click(confirmButtonInDialog);

    // Verifica os resultados
    expect(fetch).toHaveBeenCalledWith('/api/questoes/1', { method: 'DELETE' });
    expect(await screen.findByText('Questão excluída com sucesso')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Qual é a capital do Brasil?')).not.toBeInTheDocument();
    });
  });

  it('não deve excluir a questão se o usuário cancelar a ação', async () => {
    const user = userEvent.setup();
    
    // Mock da requisição de tags
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: ['geografia', 'brasil'] }),
    });
    
    // Mock da requisição inicial de questões
    fetch.mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) 
    });
    
    renderWithTheme(<ListarQuestoesPage />);

    // Aguarda a questão ser renderizada
    await waitFor(() => {
      expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Encontra o botão "Excluir" no card
    const card = screen.getByText('Qual é a capital do Brasil?');
    const deleteButton = within(card.closest('.MuiCard-root')).getByRole('button', { name: /excluir/i });
    await user.click(deleteButton);

    // Espera o diálogo aparecer
    const dialog = await screen.findByRole('dialog');
    
    // Usa getByRole para encontrar o botão "Cancelar"
    const cancelButton = within(dialog).getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);
    
    // Verifica os resultados
    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith('/api/questoes/1', { method: 'DELETE' });
    });
  });

  describe('Funcionalidade de Edição', () => {
    it('deve abrir o modal de edição ao clicar em "Editar"', async () => {
        const user = userEvent.setup();
        
        // Mock da requisição de tags
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: ['geografia', 'brasil'] }),
        });
        
        // Mock da requisição inicial de questões
        fetch.mockResolvedValueOnce({ 
          ok: true, 
          json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) 
        });
        
        renderWithTheme(<ListarQuestoesPage />);
    
        // Aguarda a questão ser renderizada
        await waitFor(() => {
          expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();
        }, { timeout: 3000 });
        
        const card = screen.getByText('Qual é a capital do Brasil?');
        const editButton = within(card.closest('.MuiCard-root')).getByRole('button', { name: /editar/i });
        await user.click(editButton);
    
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Editar Questão')).toBeInTheDocument();
    });
    it('deve exibir um snackbar de sucesso e atualizar a questão na tela ao salvar', async () => {
        const user = userEvent.setup();

        // Mock de fetch
        fetch.mockResolvedValueOnce({ok: true, json: async () => ({ tags: [] })  });
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length })  });

        renderWithTheme(<ListarQuestoesPage />);

        // Aguarda a questão ser renderizada
        const questionText = 'Qual é a capital do Brasil?';
        await screen.findByText(questionText);

        const card = screen.getByText(questionText).closest('.MuiCard-root');
        const editButton = within(card).getByRole('button', { name: /editar/i });
        await user.click(editButton);

        const dialog = await screen.findByRole('dialog');
        const saveButton = within(dialog).getByRole('button', { name: /salvar simulado/i });
        await user.click(saveButton);

        expect(await screen.findByText('Questão atualizada com sucesso!')).toBeInTheDocument();

        expect(screen.getByText('Qual é a capital do Brasil? (Editado)')).toBeInTheDocument();
    });

  });

  describe('Funcionalidade de Interacao da Lista', () => {

    beforeEach(() => { //mock padrao
        fetch.mockResolvedValue({ 
          ok: true, 
          json: async () => ({ 
            items: mockQuestoes, 
            total: mockQuestoes.length,
            tags: ['geografia' , 'ciência'] }) 
           });
    });
    
    it('deve chamar a API com o parametro de busca ao digitar no campo de busca', async () => {
        const user = userEvent.setup();
        renderWithTheme(<ListarQuestoesPage />);

        await screen.findByText('Questões Cadastradas');
        const searchInput = screen.getByPlaceholderText(/buscar por enunciado/i);
        await user.type(searchInput, 'Brasil');

        waitFor(() => {
          expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/questoes?search=Brasil'));
        } , { timeout: 3000 });
    });
    
    it('deve chamar a API com os parâmetros de ordenação ao alterar o seletor', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ListarQuestoesPage />);
    
      await screen.findByText(/Qual é a capital do Brasil\?/i);

      // Altera o campo de ordenação
      const sortSelect = screen.getByLabelText(/ordenar por/i);
      await user.click(sortSelect);
      await user.click(screen.getByRole('option', { name: /data de atualização/i }));
    
      await waitFor(() => {
        expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('sortBy=updatedAt'));
      });

      // Altera a ordem (asc/desc)
      const orderButton = screen.getByTitle(/mais recentes primeiro/i);
      await user.click(orderButton);
    
      await waitFor(() => {
        expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('sortOrder=asc'));
      });
    });
    
    it('deve chamar a API com o filtro de tag ao selecionar uma', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ListarQuestoesPage />);

      await screen.findByText(/Qual é a capital do Brasil\?/i);

      // Clica no autocomplete para abrir as opções
      const autocomplete = screen.getByLabelText(/filtrar por tags/i);
      await user.click(autocomplete);

      // Clica na opção 'geografia'
      await user.click(await screen.findByText('geografia'));

      await waitFor(() => {
        expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('tags=geografia'));
      });
    });

    it('deve chamar a API com o parâmetro de página ao clicar na paginação', async () => {
      const user = userEvent.setup();
      // Mock para simular múltiplas páginas
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockQuestoes, total: 20, tags: [] }), // 20 itens = 2 páginas
      });
    
      renderWithTheme(<ListarQuestoesPage />);

      // Procura o botão da página 2 e clica nele
      const pageTwoButton = await screen.findAllByRole('button', { name: /go to page 2/i });
      await user.click(pageTwoButton[0]);

      await waitFor(() => {
        expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('page=2'));
      });
    });
  });



  describe.skip('Funcionalidade de Exportação', () => {
    it('deve chamar a API de gerar prova e iniciar o download', async () => {
        const user = userEvent.setup();
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes }) });
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ latexContent: 'conteudo-latex', fileName: 'prova.tex' }),
        });

        const linkMock = {
            href: '',
            download: '',
            click: jest.fn(),
            remove: jest.fn(),
        };
        jest.spyOn(document, 'createElement').mockReturnValue(linkMock);
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();

        renderWithTheme(<ListarQuestoesPage />);

        const exportButton = await screen.findByRole('button', { name: /exportar para latex/i });
        await user.click(exportButton);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /gerando.../i })).toBeDisabled();
        });
        
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/gerar-prova', { method: 'POST' });
        });
        
        expect(linkMock.download).toBe('prova.tex');
        expect(linkMock.click).toHaveBeenCalledTimes(1);
        expect(alert).toHaveBeenCalledWith('Arquivo LaTeX gerado com sucesso!');

        expect(await screen.findByRole('button', { name: /exportar para latex/i })).not.toBeDisabled();
    });
  });
});