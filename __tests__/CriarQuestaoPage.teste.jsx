// __tests__/CriarQuestaoPage.test.jsx

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CriarQuestaoPage from '../src/app/(app)/(professor)/questoes/criar/page';
import { upload } from '@vercel/blob/client'; // Importar para mock

// Mock para chamadas de API
global.fetch = jest.fn();

// Mock para Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockImplementation((key) => {
      if (key === 'cursoId') return '123';
      if (key === 'cursoNome') return 'Meu Curso';
      return null;
    }),
  }),
}));

// Mock para o cliente de upload do Vercel Blob
jest.mock('@vercel/blob/client', () => ({
  upload: jest.fn(),
}));

const testTheme = createTheme({});

// Função de renderização customizada com os providers necessários
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={testTheme}>{component}</ThemeProvider>
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
  let consoleErrorSpy;

  beforeEach(() => {
    fetch.mockClear();
    upload.mockClear();
    // Silencia erros esperados no console durante os testes de falha
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // --- TESTES BÁSICOS E DE SUBMISSÃO (SEUS TESTES REFINADOS) ---
  describe('Renderização e Submissão Principal', () => {
    it('deve renderizar o formulário e o botão de voltar quando houver cursoId', () => {
      renderWithTheme(<CriarQuestaoPage />);
      expect(screen.getByRole('heading', { name: /Criar Nova Questão/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Voltar para Meu Curso/i })).toBeInTheDocument();
    });

    it('deve submeter com sucesso uma questão de múltipla escolha', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '123' }) });
      renderWithTheme(<CriarQuestaoPage />);
      
      await user.type(screen.getByLabelText('Enunciado da Questão'), 'Qual a capital do Brasil?');
      await user.type(screen.getByPlaceholderText('Alternativa A'), 'Brasília');
      await user.type(screen.getByPlaceholderText('Alternativa B'), 'São Paulo');
      await user.type(screen.getByLabelText('Tags (separadas por vírgula)'), 'geografia, brasil');

      await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/questoes', expect.objectContaining({
            body: expect.stringContaining('"tipo":"alternativa"')
        }));
        expect(screen.getByText('Questão criada com sucesso!')).toBeInTheDocument();
      }, { timeout: 10000 });
    }, 15000);

    it('deve submeter com sucesso uma questão de afirmações (V/F)', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      renderWithTheme(<CriarQuestaoPage />);

      await selectQuestionType(user, /Múltiplas Afirmações/i);
      await user.type(screen.getByLabelText('Enunciado da Questão'), 'Julgue os itens.');
      await user.type(screen.getByLabelText('Afirmação 1'), 'O céu é azul.'); // Correta por padrão
      
      await user.click(screen.getByRole('button', { name: /\+ Adicionar Afirmação/i }));
      
      const segundaAfirmacaoInput = screen.getByLabelText('Afirmação 2');
      await user.type(segundaAfirmacaoInput, 'A terra é plana.');
      
      const parentContainer = segundaAfirmacaoInput.closest('.MuiBox-root');
      const botaoF = within(parentContainer).getByRole('button', { name: 'F' });
      await user.click(botaoF);

      await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));

      await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith('/api/questoes', expect.objectContaining({
              body: expect.stringContaining('"afirmacoes":[{"texto":"O céu é azul.","correta":true},{"texto":"A terra é plana.","correta":false}]')
          }));
      }, { timeout: 10000 });
    }, 15000);

    it('deve submeter com sucesso uma questão dissertativa', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        renderWithTheme(<CriarQuestaoPage />);
  
        await selectQuestionType(user, /Dissertativa/i);
        await user.type(screen.getByLabelText('Enunciado da Questão'), 'Discorra sobre a importância dos testes.');
        await user.type(screen.getByLabelText(/Gabarito/i), 'Testes garantem a qualidade.');
        await user.type(screen.getByLabelText(/Palavras-chave/i), 'qualidade, jest');

        await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));
  
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/questoes', expect.objectContaining({
                body: expect.stringContaining('"gabarito":"Testes garantem a qualidade."')
            }));
        }, { timeout: 10000 });
      }, 15000);
  });

  // --- TESTES PARA FUNCIONALIDADES DE IA ---
  describe('Funcionalidades de Inteligência Artificial', () => {
    it('deve gerar um enunciado com IA ao clicar no botão "Gerar Enunciado"', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ enunciadoGerado: 'Enunciado gerado pela IA.' }) });
      renderWithTheme(<CriarQuestaoPage />);

      await user.type(screen.getByLabelText('Tags (separadas por vírgula)'), 'programação');
      await user.click(screen.getByRole('button', { name: /Gerar Enunciado/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/gerar-enunciado', expect.any(Object));
        expect(screen.getByLabelText('Enunciado da Questão')).toHaveValue('Enunciado gerado pela IA.');
        expect(screen.getByText('Enunciado gerado com sucesso!')).toBeInTheDocument();
      });
    });

    it('deve revisar uma questão com IA e atualizar os campos', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ 
        enunciadoRevisado: 'Qual é a capital correta do Brasil?',
        alternativasRevisadas: ['Brasília.', 'São Paulo.']
      }) });
      renderWithTheme(<CriarQuestaoPage />);

      await user.type(screen.getByLabelText('Enunciado da Questão'), 'qual a capital do brasil');
      await user.type(screen.getByPlaceholderText('Alternativa A'), 'brasilia');
      await user.type(screen.getByPlaceholderText('Alternativa B'), 'sao paulo');
      
      await user.click(screen.getByRole('button', { name: /Revisar/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/revisar-questao', expect.any(Object));
        expect(screen.getByLabelText('Enunciado da Questão')).toHaveValue('Qual é a capital correta do Brasil?');
        expect(screen.getByPlaceholderText('Alternativa A')).toHaveValue('Brasília.');
        expect(screen.getByText('Questão revisada com sucesso pela IA!')).toBeInTheDocument();
      }, { timeout: 10000 });
    }, 15000);

    it('deve gerar distratores com IA para preencher alternativas vazias', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ alternativasIncorretas: ['Rio de Janeiro', 'Salvador', 'Recife'] }) });
      renderWithTheme(<CriarQuestaoPage />);

      await user.type(screen.getByLabelText('Enunciado da Questão'), 'Qual a capital do Brasil?');
      await user.type(screen.getByPlaceholderText('Alternativa A'), 'Brasília'); // Alternativa correta
      
      // Adiciona mais duas alternativas vazias
      await user.click(screen.getByRole('button', {name: '+ Adicionar alternativa'}));
      await user.click(screen.getByRole('button', {name: '+ Adicionar alternativa'}));

      await user.click(screen.getByRole('button', { name: /Gerar Distratores/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/gerar-alternativa', expect.objectContaining({
          body: expect.stringContaining('"quantidade":3') // B, C, D vazias
        }));
      }, { timeout: 10000 });
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Alternativa B')).toHaveValue('Rio de Janeiro');
        expect(screen.getByPlaceholderText('Alternativa C')).toHaveValue('Salvador');
      }, { timeout: 10000 });
    });
  });

  // --- TESTES DE UI E CASOS DE BORDA ---
  describe('Interações de UI e Casos de Borda', () => {
    it('deve limpar o formulário ao clicar no botão "Limpar"', async () => {
      renderWithTheme(<CriarQuestaoPage />);
      const enunciadoInput = screen.getByLabelText('Enunciado da Questão');
      await user.type(enunciadoInput, 'Texto de teste');
      expect(enunciadoInput).toHaveValue('Texto de teste');

      await user.click(screen.getByRole('button', { name: /Limpar/i }));
      expect(enunciadoInput).toHaveValue('');
    });

    it('deve adicionar e remover uma alternativa', async () => {
      renderWithTheme(<CriarQuestaoPage />);
      
      // Verifica estado inicial
      expect(screen.getAllByPlaceholderText(/Alternativa [A-Z]/i)).toHaveLength(2);
      
      // Adiciona
      await user.click(screen.getByRole('button', { name: '+ Adicionar alternativa' }));
      expect(screen.getAllByPlaceholderText(/Alternativa [A-Z]/i)).toHaveLength(3);
      expect(screen.getByPlaceholderText('Alternativa C')).toBeInTheDocument();

      // Remove
      const allDeleteButtons = screen.getAllByTitle('Remover alternativa');
      await user.click(allDeleteButtons[2]); // Clica no botão de remover da Alternativa C
      expect(screen.queryByPlaceholderText('Alternativa C')).not.toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/Alternativa [A-Z]/i)).toHaveLength(2);
    });

    it('deve resetar campos específicos ao mudar o tipo da questão', async () => {
      renderWithTheme(<CriarQuestaoPage />);
      await user.type(screen.getByPlaceholderText('Alternativa A'), 'Texto da alternativa');
      expect(screen.getByPlaceholderText('Alternativa A')).toHaveValue('Texto da alternativa');

      // Muda para dissertativa
      await selectQuestionType(user, /Dissertativa/i);
      expect(screen.queryByPlaceholderText('Alternativa A')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Gabarito/i)).toBeInTheDocument();

      // Volta para múltipla escolha
      await selectQuestionType(user, /Múltipla escolha/i);
      expect(screen.getByPlaceholderText('Alternativa A')).toHaveValue(''); // Deve estar limpo
    });
  });

  // --- TESTES DE VALIDAÇÃO E ERROS ---
  describe('Validações de Formulário e Erros de API', () => {
    it('deve exibir alerta se o enunciado estiver vazio na submissão', async () => {
      renderWithTheme(<CriarQuestaoPage />);
      await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));
      expect(await screen.findByText('Por favor, preencha o enunciado da questão.')).toBeInTheDocument();
    });

    it('deve exibir alerta se uma alternativa estiver vazia na submissão', async () => {
        renderWithTheme(<CriarQuestaoPage />);
        await user.type(screen.getByLabelText('Enunciado da Questão'), 'Teste');
        await user.type(screen.getByPlaceholderText('Alternativa A'), 'Texto');
        // Alternativa B fica vazia
        await user.click(screen.getByRole('button', { name: /Salvar Questão/i }));
        expect(await screen.findByText('Todas as alternativas devem ser preenchidas.')).toBeInTheDocument();
    });
    
    it('deve exibir um alerta de erro se a API de salvar falhar', async () => {
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
  
      expect(await screen.findByText('Erro interno do servidor')).toBeInTheDocument();
    });
  });

});