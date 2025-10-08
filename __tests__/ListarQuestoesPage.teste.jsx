import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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
    fetch.mockRejectedValueOnce(new Error('Erro ao buscar questões'));
    renderWithTheme(<ListarQuestoesPage />);
    expect(await screen.findByText('Erro ao buscar questões')).toBeInTheDocument();
  });

  it('deve exibir uma mensagem quando nenhuma questão for encontrada', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });
    renderWithTheme(<ListarQuestoesPage />);
    expect(await screen.findByText('Nenhuma questão cadastrada.')).toBeInTheDocument();
  });

  it('deve renderizar a lista de questões com sucesso', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockQuestoes }),
    });
    renderWithTheme(<ListarQuestoesPage />);
    expect(await screen.findByText('Qual é a capital do Brasil?')).toBeInTheDocument();
    expect(screen.getByText('A Terra é plana?')).toBeInTheDocument();
    expect(screen.getByText(/Brasília \(Correta\)/)).toBeInTheDocument();
  });

 describe('Funcionalidade de Exclusão', () => {

  it('deve excluir uma questão com sucesso após a confirmação do usuário', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes }) });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Questão excluída' }) });
    
    renderWithTheme(<ListarQuestoesPage />);
    
    // Encontra o botão "Excluir" no card
    const card = await screen.findByText('Qual é a capital do Brasil?');
    const deleteButtonOnCard = within(card.closest('.MuiCard-root')).getByRole('button', { name: /excluir/i });
    await user.click(deleteButtonOnCard);

    // Espera o diálogo aparecer
    const dialog = await screen.findByRole('dialog');
    
    // Usa getByRole e busca por "Excluir"
    const confirmButtonInDialog = within(dialog).getByRole('button', { name: /excluir/i });
    await user.click(confirmButtonInDialog);

    // Verifica os resultados
    expect(fetch).toHaveBeenCalledWith('/api/questoes/1', { method: 'DELETE' });
    expect(alert).toHaveBeenCalledWith('Questão excluída com sucesso');
    await waitFor(() => {
      expect(screen.queryByText('Qual é a capital do Brasil?')).not.toBeInTheDocument();
    });
  });

  it('não deve excluir a questão se o usuário cancelar a ação', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes }) });
    
    renderWithTheme(<ListarQuestoesPage />);

    // Encontra o botão "Excluir" no card
    const card = await screen.findByText('Qual é a capital do Brasil?');
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
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes }) });
        renderWithTheme(<ListarQuestoesPage />);
    
        const card = await screen.findByText('Qual é a capital do Brasil?');
        const editButton = within(card.closest('.MuiCard-root')).getByRole('button', { name: /editar/i });
        await user.click(editButton);
    
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Editar Questão')).toBeInTheDocument();
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