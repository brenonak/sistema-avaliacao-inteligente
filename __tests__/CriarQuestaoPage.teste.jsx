// __tests__/CriarQuestaoPage.test.jsx

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CriarQuestaoPage from '../src/app/questoes/criar/page';

// Mock para chamadas de API
global.fetch = jest.fn();

// Mock para a função alert
jest.spyOn(window, 'alert').mockImplementation(() => {});

const testTheme = createTheme({
  // ... (sua configuração de tema)
});

// Função de renderização customizada com os providers necessários
const renderWithTheme = (component) => {
  return render(
    <AppRouterCacheProvider>
      <ThemeProvider theme={testTheme}>{component}</ThemeProvider>
    </AppRouterCacheProvider>
  );
};

// Helper para selecionar um tipo de questão no MUI Select
async function selectQuestionType(user, typeName) {
  const selectElement = screen.getByRole('combobox', { name: /Tipo de questão/i });
  await user.click(selectElement);
  const option = await screen.findByRole('option', { name: typeName });
  await user.click(option);
}

describe('CriarQuestaoPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    
    fetch.mockReset();
    window.alert.mockClear();
  });

  // --- TESTES BÁSICOS E DE MÚLTIPLA ESCOLHA ---
  it('deve renderizar o formulário corretamente no estado inicial', () => {
    renderWithTheme(<CriarQuestaoPage />);
    expect(screen.getByRole('heading', { name: /Criar Nova Questão/i })).toBeInTheDocument();
  });

  it('deve submeter o formulário com sucesso para uma questão de múltipla escolha', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '123' }) });
    renderWithTheme(<CriarQuestaoPage />);
    
    await user.type(screen.getByLabelText('Enunciado da Questão'), 'Qual a capital do Brasil?');
    await user.type(screen.getByPlaceholderText('Alternativa A'), 'Brasília');
    await user.type(screen.getByPlaceholderText('Alternativa B'), 'São Paulo');
    await user.type(screen.getByLabelText('Tags (separadas por vírgula)'), 'geografia, brasil');

    await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/questoes', expect.any(Object));
      expect(window.alert).toHaveBeenCalledWith('Questão salva com sucesso!');
    });
  });

  it('deve submeter com sucesso uma questão de afirmações (V/F)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    renderWithTheme(<CriarQuestaoPage />);

    await selectQuestionType(user, /Múltiplas Afirmações/i);
    await user.type(screen.getByLabelText('Enunciado da Questão'), 'Julgue os itens a seguir.');
    await user.type(screen.getByLabelText('Afirmação 1'), 'O céu é azul.');
    
    await user.click(screen.getByRole('button', { name: /\+ Adicionar Afirmação/i }));
    
   
    const segundaAfirmacao = screen.getByLabelText('Afirmação 2');
    await user.type(segundaAfirmacao, 'A terra é plana.');
    
    // Encontra o container pai do input para achar o botão "F" correto
    const parentContainer = segundaAfirmacao.closest('.MuiBox-root');
    const botaoF = within(parentContainer).getByRole('button', { name: 'F' });
    await user.click(botaoF);

    await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/questoes', expect.objectContaining({
            body: expect.stringContaining('"correta":false'),
        }));
    });
  });

  
  it('deve submeter com sucesso uma questão de proposições múltiplas (somatório)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    renderWithTheme(<CriarQuestaoPage />);

    await selectQuestionType(user, /Proposições Múltiplas/i);
    
    await user.type(screen.getByLabelText('Enunciado da Questão'), 'Some os valores das proposições corretas.');
    await user.type(screen.getByLabelText(/Afirmação de valor 1/i), 'Primeira proposição');
    
    await user.click(screen.getByRole('button', { name: /\+ Adicionar Proposição/i }));
    await user.type(screen.getByLabelText(/Afirmação de valor 2/i), 'Segunda proposição');
    await user.click(screen.getByRole('button', { name: /\+ Adicionar Proposição/i }));
    await user.type(screen.getByLabelText(/Afirmação de valor 4/i), 'Terceira proposição');
    
    const vButtons = screen.getAllByRole('button', { name: 'V' });
    await user.click(vButtons[0]); // Marca a de valor 1 (V)
    await user.click(vButtons[2]); // Marca a de valor 4 (V)
    
    expect(screen.getByText(/Resposta Correta \(Soma\):/i)).toHaveTextContent('5');

    await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/questoes', expect.any(Object));
    });
  }, 10000); // Aumento do timeout para 10 segundos

  // --- TESTES DE VALIDAÇÃO E ERROS ---

  
  it('deve exibir alerta se a resposta numérica estiver vazia', async () => {
    renderWithTheme(<CriarQuestaoPage />);
    await selectQuestionType(user, /Resposta Numérica/i);
    await user.type(screen.getByLabelText('Enunciado da Questão'), 'Teste numérico');
    await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));
    expect(window.alert).toHaveBeenCalledWith('Por favor, informe a resposta correta.');
  });
  
  
  it('deve exibir um alerta de erro se a API falhar', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Erro interno do servidor' }),
    });
    renderWithTheme(<CriarQuestaoPage />);
    
    await user.type(screen.getByLabelText('Enunciado da Questão'), 'Teste de falha');
    await user.type(screen.getByPlaceholderText('Alternativa A'), 'A');
    await user.type(screen.getByPlaceholderText('Alternativa B'), 'B');
    await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro interno do servidor');
    });

    consoleErrorSpy.mockRestore();
  });

  // --- TESTES DE UI ADICIONAIS ---

  
  it('deve renderizar chips de tags ao digitar no campo de tags', async () => {
    renderWithTheme(<CriarQuestaoPage />);
    const tagsInput = screen.getByLabelText('Tags (separadas por vírgula)');
    await user.type(tagsInput, 'react, jest, testing');

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('jest')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });
});