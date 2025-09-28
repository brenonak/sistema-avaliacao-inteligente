// __tests__/CriarQuestaoPage.test.jsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import userEvent from '@testing-library/user-event';
import CriarQuestaoPage from '../src/app/questoes/criar/page'; // Ajustar o caminho para o componente caso mude de lugar

// usada para simular chamadas de API
global.fetch = jest.fn();

// Mock para a função alert, para que possamos verificar se ela é chamada
// sem de fato abrir um popup durante os testes.
jest.spyOn(window, 'alert').mockImplementation(() => {});

// Create a theme for testing that matches our app configuration
const testTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class'
  },
  palette: {
    primary: {
      main: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
      contrastText: '#000000',
    },
    background: {
      default: '#ffffff',
      paper: '#f7f7f7',
    },
    text: {
      primary: '#000000',
      secondary: '#4f4f4f',
      disabled: '#9e9e9e',
    },
  },
});

// Custom render function that includes theme provider
const renderWithTheme = (component) => {
  return render(
    <AppRouterCacheProvider>
      <ThemeProvider theme={testTheme}>
        {component}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};

describe('CriarQuestaoPage', () => {

  // Limpa os mocks s
  beforeEach(() => {
    fetch.mockClear();
    window.alert.mockClear();
  });

  //TESTE 1
  it('deve renderizar o formulário corretamente no estado inicial', () => {
    renderWithTheme(<CriarQuestaoPage />);

    
    expect(screen.getByRole('heading', { name: /Criar Nova Questão/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Enunciado da Questão/i)).toBeInTheDocument();
    
    // For MUI Select, we need to check the hidden input element
    const selectElement = screen.getByRole('combobox', { name: /Tipo de questão/i });
    expect(selectElement).toBeInTheDocument();
    expect(selectElement).toHaveAttribute('aria-expanded', 'false');
    
    expect(screen.getAllByRole('textbox')).toHaveLength(3); // 1 enunciado + 2 alternativas
    expect(screen.getByRole('button', { name: /Salvar Questão/i })).toBeInTheDocument();
  });

    //TESTE 2
  it('deve esconder o campo de alternativas quando o tipo for "Dissertativa"', async () => {
    const user = userEvent.setup();
    renderWithTheme(<CriarQuestaoPage />);

    // Garante que as alternativas estão visíveis inicialmente
    expect(screen.getByRole('heading', { name: /Alternativas/i })).toBeInTheDocument();

    // Para MUI Select, precisamos clicar no select para abri-lo e depois clicar na opção
    const selectElement = screen.getByRole('combobox', { name: /Tipo de questão/i });
    await user.click(selectElement);
    
    // Aguarda o menu abrir e clica na opção "Dissertativa"
    const dissertativaOption = await screen.findByRole('option', { name: /Dissertativa/i });
    await user.click(dissertativaOption);

    // Aguarda a UI atualizar
    await waitFor(() => {
      // Verifica se a seção de alternativas desapareceu
      expect(screen.queryByRole('heading', { name: /Alternativas/i })).not.toBeInTheDocument();
    });
  });    //TESTE 3
  it('deve permitir adicionar e remover alternativas', () => {
    renderWithTheme(<CriarQuestaoPage />);

    // Verifica se começamos com 2 alternativas
    expect(screen.getAllByPlaceholderText(/Alternativa/i)).toHaveLength(2);

    // Clica no botão para adicionar uma nova alternativa
    const addButton = screen.getByRole('button', { name: /\+ Adicionar alternativa/i });
    fireEvent.click(addButton);

    // Verifica se agora temos 3 alternativas
    expect(screen.getAllByPlaceholderText(/Alternativa/i)).toHaveLength(3);

    // Pega todos os botões "Remover" e clica no último
    const removeButtons = screen.getAllByRole('button', { name: /Remover/i });
    fireEvent.click(removeButtons[2]);

    // Verifica se voltamos a ter 2 alternativas
    expect(screen.getAllByPlaceholderText(/Alternativa/i)).toHaveLength(2);
  });

  //TESTE 4
  it('deve exibir um alerta se o enunciado estiver vazio ao submeter', () => {
    renderWithTheme(<CriarQuestaoPage />);

    const salvarButton = screen.getByRole('button', { name: /Salvar Questão/i });
    fireEvent.click(salvarButton);

    // Verifica se o alerta correto foi exibido e se a API não foi chamada
    expect(window.alert).toHaveBeenCalledWith('Por favor, preencha o enunciado da questão.');
    expect(fetch).not.toHaveBeenCalled();
  });

  //TESTE 5
  it('deve submeter o formulário com sucesso para uma questão de múltipla escolha', async () => {
    // Configura o mock do fetch para simular uma resposta de sucesso da API
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', message: 'Questão criada!' }),
    });

    renderWithTheme(<CriarQuestaoPage />);

    // Preenche o formulário
    fireEvent.change(screen.getByLabelText(/Enunciado da Questão/i), {
      target: { value: 'Qual é a capital do Brasil?' },
    });
    fireEvent.change(screen.getByPlaceholderText('Alternativa A'), {
      target: { value: 'Brasília' },
    });
    fireEvent.change(screen.getByPlaceholderText('Alternativa B'), {
      target: { value: 'Rio de Janeiro' },
    });

    // Clica no botão de salvar
    const salvarButton = screen.getByRole('button', { name: /Salvar Questão/i });
    fireEvent.click(salvarButton);

    // Espera a UI atualizar após a chamada assíncrona
    await waitFor(() => {
      // Verifica se a API foi chamada com os dados corretos
      expect(fetch).toHaveBeenCalledWith('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'alternativa',
          enunciado: 'Qual é a capital do Brasil?',
          alternativas: [
            { letra: 'A', texto: 'Brasília', correta: true },
            { letra: 'B', texto: 'Rio de Janeiro', correta: false },
          ],
        }),
      });
    });

    // Verifica se o alerta de sucesso foi mostrado
        expect(window.alert).toHaveBeenCalledWith('Questão salva com sucesso!');

        // Verifica se o campo de enunciado foi limpo após o sucesso
        waitFor(() => {
            expect(screen.getByLabelText(/Enunciado da Questão/i)).toHaveValue('');
        });
    });
});