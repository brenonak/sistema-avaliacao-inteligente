// __tests__/ListarQuestoesPage.teste.jsx

import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ListarQuestoesPage from '../src/app/(app)/(professor)/questoes/page';
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
    tipo: 'afirmacoes', 
    afirmacoes: [ 
        { texto: 'Sim, é plana', correta: false },
        { texto: 'Não, é um geoide', correta: true },
    ],
    tags: ['ciência']
  },
  {
    id: '3',
    enunciado: 'Qual o valor de Pi com duas casas decimais?',
    tipo: 'numerica',
    respostaCorreta: 3.14,
    margemErro: 0.01,
    tags: ['matemática']
  },
  {
    id: '4',
    enunciado: 'Descreva o que é uma API REST.',
    tipo: 'dissertativa',
    gabarito: 'É um estilo de arquitetura de software para sistemas distribuídos.',
    tags: ['tecnologia']
  },
  {
    id: '5',
    enunciado: 'Analise as proposições sobre programação.',
    tipo: 'proposicoes',
    proposicoes: [
        { texto: 'JavaScript é uma linguagem compilada.', valor: '01', correta: false },
        { texto: 'Python é uma linguagem interpretada.', valor: '02', correta: true },
        { texto: 'HTML é uma linguagem de programação.', valor: '04', correta: false },
    ],
    tags: ['tecnologia']
  },
];

const theme = createTheme({
  palette: {
    accent: {
      main: '#ff5722', 
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

beforeEach(() => {
  fetch.mockClear();
  global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
  global.URL.revokeObjectURL = jest.fn();
  
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ListarQuestoesPage', () => {
    
  it('deve exibir o estado de carregamento inicialmente', () => {
    fetch.mockImplementation(() => new Promise(() => {})); 
    renderWithTheme(<ListarQuestoesPage />);
    expect(screen.getByText(/carregando.../i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('deve exibir uma mensagem de erro se a busca de questões falhar', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: [] }),
    });
    fetch.mockRejectedValueOnce(new Error('Erro ao buscar questões'));
    renderWithTheme(<ListarQuestoesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Erro ao buscar questões/i)).toBeInTheDocument();
    });
  });

  it('deve exibir uma mensagem quando nenhuma questão for encontrada', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: [] }),
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], total: 0 }),
    });
    renderWithTheme(<ListarQuestoesPage />);
    await waitFor(() => {
      expect(screen.getByText('Nenhuma questão cadastrada.')).toBeInTheDocument();
    });
  });

  it('deve renderizar a lista de questões com sucesso', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: ['geografia', 'brasil', 'ciência'] }),
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }),
    });
    renderWithTheme(<ListarQuestoesPage />);
    await waitFor(() => {
      expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();
    });
    expect(screen.getByText('A Terra é plana?')).toBeInTheDocument();
    expect(screen.getByText(/Brasília.*Correta/i)).toBeInTheDocument();
  });

  describe('Funcionalidade de Exclusão', () => {
    
    it('deve excluir uma questão com sucesso após a confirmação do usuário', async () => {
        const user = userEvent.setup();
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: ['geografia', 'brasil'] }),
        });
        fetch.mockResolvedValueOnce({ 
          ok: true, 
          json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) 
        });
        fetch.mockResolvedValueOnce({ 
          ok: true, 
          json: async () => ({ message: 'Questão excluída' }) 
        });
        renderWithTheme(<ListarQuestoesPage />);
        
        await screen.findByText('Qual é a capital do Brasil?');
        
        const card = screen.getByText('Qual é a capital do Brasil?');
        const deleteButtonOnCard = within(card.closest('.MuiCard-root')).getByRole('button', { name: /excluir/i });
        await user.click(deleteButtonOnCard);
  
        const dialog = await screen.findByRole('dialog');
        const confirmButtonInDialog = within(dialog).getByRole('button', { name: /excluir/i });
        await user.click(confirmButtonInDialog);
  
        expect(fetch).toHaveBeenCalledWith('/api/questoes/1', { method: 'DELETE' });
        expect(await screen.findByText('Questão excluída com sucesso')).toBeInTheDocument();
        await waitFor(() => {
          expect(screen.queryByText('Qual é a capital do Brasil?')).not.toBeInTheDocument();
        });
      });
  
      it('não deve excluir a questão se o usuário cancelar a ação', async () => {
        const user = userEvent.setup();
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: ['geografia', 'brasil'] }),
        });
        fetch.mockResolvedValueOnce({ 
          ok: true, 
          json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) 
        });
        renderWithTheme(<ListarQuestoesPage />);
  
        await screen.findByText('Qual é a capital do Brasil?');
        
        const card = screen.getByText('Qual é a capital do Brasil?');
        const deleteButton = within(card.closest('.MuiCard-root')).getByRole('button', { name: /excluir/i });
        await user.click(deleteButton);
  
        const dialog = await screen.findByRole('dialog');
        const cancelButton = within(dialog).getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);
        
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
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: ['geografia', 'brasil'] }),
        });
        fetch.mockResolvedValueOnce({ 
          ok: true, 
          json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) 
        });
        renderWithTheme(<ListarQuestoesPage />);
    
        await screen.findByText('Qual é a capital do Brasil?');
        
        const card = screen.getByText('Qual é a capital do Brasil?');
        const editButton = within(card.closest('.MuiCard-root')).getByRole('button', { name: /editar/i });
        await user.click(editButton);
    
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Editar Questão')).toBeInTheDocument();
    });
    it('deve exibir um snackbar de sucesso e atualizar a questão na tela ao salvar', async () => {
        const user = userEvent.setup();
        fetch.mockResolvedValueOnce({ok: true, json: async () => ({ tags: [] })  });
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length })  });
        renderWithTheme(<ListarQuestoesPage />);

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

 // __tests__/ListarQuestoesPage.teste.jsx

  describe('Funcionalidade de Interacao da Lista', () => {

    it('deve chamar a API com os parâmetros de ordenação ao alterar o seletor', async () => {
      const user = userEvent.setup();
      // Mocks para a renderização inicial
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: [] }) });
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) });

      renderWithTheme(<ListarQuestoesPage />);
      await screen.findByText('Qual é a capital do Brasil?');

      // Mock para a chamada após mudar a ordenação
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) });
      const sortSelect = screen.getByLabelText(/ordenar por/i);
      fireEvent.mouseDown(sortSelect);
      await user.click(screen.getByRole('option', { name: /data de atualização/i }));
      
      // Espera a UI atualizar após a chamada
      await waitFor(() => {
          expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('sortBy=updatedAt'));
      });

      // Mock para a chamada após clicar no botão de ordem
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) });
      const orderButton = await screen.findByTitle(/mais recentes primeiro/i);
      await user.click(orderButton);

      await waitFor(() => {
          expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('sortOrder=asc'));
      });
    });

    it('deve chamar a API com o filtro de tag ao selecionar uma', async () => {
      const user = userEvent.setup();
      // Mocks para a renderização inicial
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: ['geografia', 'ciência'] }) });
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) });
      
      renderWithTheme(<ListarQuestoesPage />);
      await screen.findByText(/Qual é a capital do Brasil\?/i);

      // Mock para a chamada após selecionar a tag
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], total: 0 }) });
      const autocomplete = screen.getByLabelText(/filtrar por tags/i);
      fireEvent.mouseDown(autocomplete);
      const options = await screen.findAllByRole('option', { name: /geografia/i });
      await user.click(options[0]);

      await waitFor(() => {
        expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('tags=geografia'));
      });
    });

    // Este teste já estava passando, mas o mock foi ajustado para consistência
    it('deve chamar a API com o parâmetro de página ao clicar na paginação', async () => {
      const user = userEvent.setup();
      // Mocks para a renderização inicial
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: [] }) });
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes.slice(0, 5), total: 20 }) });

      renderWithTheme(<ListarQuestoesPage />);

      await screen.findByText(/Qual é a capital do Brasil\?/i);
      
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes.slice(0, 5), total: 20 }) });
      const pageTwoButtons = await screen.findAllByRole('button', { name: /go to page 2/i });
      await user.click(pageTwoButtons[0]);

      await waitFor(() => {
        expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('page=2'));
      });
    });
  });

  describe('Caminhos de Erro', () => {
    
    it('deve exibir um snackbar de erro se a exclusão da questão falhar', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: [] }) });
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [mockQuestoes[0]], total: 1 }) });
        fetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Permissão negada' })
        });
  
        renderWithTheme(<ListarQuestoesPage />);
  
        const card = await screen.findByText('Qual é a capital do Brasil?');
        const deleteButtonOnCard = within(card.closest('.MuiCard-root')).getByRole('button', { name: /excluir/i });
        await user.click(deleteButtonOnCard);
  
        const dialog = await screen.findByRole('dialog');
        const confirmButtonInDialog = within(dialog).getByRole('button', { name: /excluir/i });
        await user.click(confirmButtonInDialog);
  
        expect(await screen.findByText(/Permissão negada/i)).toBeInTheDocument();
        consoleErrorSpy.mockRestore();
      });
  });

  describe('Renderização de Tipos de Questão', () => {

    it('deve renderizar corretamente uma questão do tipo numérica', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: [] }) });
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) });
      renderWithTheme(<ListarQuestoesPage />);
      expect(await screen.findByText(/Resposta correta: 3.14/i)).toBeInTheDocument();
      expect(screen.getByText(/\(± 0.01\)/i)).toBeInTheDocument();
    });

    it('deve renderizar corretamente uma questão do tipo dissertativa', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: [] }) });
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) });
      renderWithTheme(<ListarQuestoesPage />);
      expect(await screen.findByText(/Gabarito: É um estilo de arquitetura/i)).toBeInTheDocument();
    });

    it('deve renderizar corretamente uma questão do tipo proposições e calcular a soma', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: [] }) });
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) });
      renderWithTheme(<ListarQuestoesPage />);
      const card = await screen.findByText(/Analise as proposições sobre programação./i);
      const proposicaoCard = card.closest('.MuiCard-root');
      const vIndicators = within(proposicaoCard).getAllByText('(V)');
      const fIndicators = within(proposicaoCard).getAllByText('(F)');
      expect(vIndicators).toHaveLength(1);
      expect(fIndicators).toHaveLength(2);
      expect(within(proposicaoCard).getByText(/Gabarito \(Soma\):/i)).toBeInTheDocument();
      expect(within(proposicaoCard).getByText('2')).toBeInTheDocument();
    });

    it('deve renderizar corretamente uma questão do tipo afirmações', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: [] }) });
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: mockQuestoes, total: mockQuestoes.length }) });
        renderWithTheme(<ListarQuestoesPage />);
        expect(await screen.findByText("I.")).toBeInTheDocument();
        expect(screen.getByText("II.")).toBeInTheDocument();
    });
  });
  
  describe('Interações Adicionais da UI', () => {
    
    it('deve limpar a busca ao clicar no ícone de limpar', async () => {
        const user = userEvent.setup();
        fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], total: 0, tags: [] }) });
        renderWithTheme(<ListarQuestoesPage />);
        
        const searchInput = screen.getByPlaceholderText(/buscar por enunciado/i);
        await user.type(searchInput, 'Teste');
        expect(searchInput.value).toBe('Teste');
        
        const clearButton = screen.getByTitle(/limpar busca/i);
        await user.click(clearButton);
        
        expect(searchInput.value).toBe('');
      });
  
      it('deve limpar as tags ao clicar no ícone de limpar do filtro', async () => {
        const user = userEvent.setup();
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tags: ['geografia', 'ciência'] }) });
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], total: 0 }) });
  
        renderWithTheme(<ListarQuestoesPage />);
  
        const autocomplete = await screen.findByLabelText(/filtrar por tags/i);
        fireEvent.mouseDown(autocomplete)
        await user.click(await screen.findByText('geografia'));
        
        expect(screen.getByText('geografia')).toBeInTheDocument();
        
        const clearTagsButton = screen.getByTitle(/limpar filtros/i);
        await user.click(clearTagsButton);
  
        expect(screen.queryByText('geografia')).not.toBeInTheDocument();
      });
  });
});