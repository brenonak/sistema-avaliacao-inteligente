import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CorrecaoPageMui from '@/app/(app)/(professor)/correcao/CorrecaoPageMui';

// Mocks globais
global.fetch = jest.fn();
global.alert = jest.fn();

// Mocks de dados
const mockCurso = { id: 'curso1', nome: 'Matemática Avançada' };
const mockProvaResumo = {
    id: 'prova1',
    _id: 'prova1',
    cursoId: 'curso1',
    titulo: 'Prova Final',
    disciplina: 'Cálculo',
    professor: 'João',
    questoes: [
        {
            _id: 'q1',
            tipo: 'dissertativa',
            enunciado: 'Explique a teoria da relatividade.',
            pontuacao: 2.0,
            gabarito: 'Texto livre'
        },
        {
            _id: 'q2',
            tipo: 'alternativa',
            enunciado: 'Quanto é 1+1?',
            pontuacao: 1.0,
            alternativas: [
                { letra: 'A', texto: '1', correta: false },
                { letra: 'B', texto: '2', correta: true }
            ]
        }
    ]
};

const mockAlunos = { items: [{ _id: 'aluno1', id: 'aluno1', nome: 'Maria Silva' }] };

// Helper de Setup
const setupMocks = () => {
    fetch.mockImplementation((url) => {
        // Lista de cursos
        if (url === '/api/cursos') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ itens: [mockCurso] })
            });
        }

        // Lista de provas do curso
        if (url.includes('/api/cursos/curso1/provas') && !url.includes('correcao-manual')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ items: [mockProvaResumo] })
            });
        }

        // Lista de alunos do curso
        if (url.includes('/api/cursos/curso1/alunos')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockAlunos)
            });
        }

        // Mock do POST salvar correção
        if (url.includes('correcao-manual')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });
        }

        return Promise.reject(new Error(`URL não mockada: ${url}`));
    });
};

describe('CorrecaoPageMui (Integração)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupMocks();
    });

    it('deve carregar prova, selecionar aluno e permitir nota decimal em dissertativa', async () => {
        const user = userEvent.setup();
        render(<CorrecaoPageMui />);

        // Aguarda aparecer o curso e o botão "Corrigir"
        await waitFor(() => {
            expect(screen.getByText('Matemática Avançada')).toBeInTheDocument();
        });

        const btnCorrigir = await screen.findByRole('button', { name: /Corrigir/i });
        await user.click(btnCorrigir);

        // Verifica se carregou os detalhes da prova
        expect(await screen.findByText(/Correção: Prova Final/i)).toBeInTheDocument();
        expect(screen.getByText('Explique a teoria da relatividade.')).toBeInTheDocument();
        expect(screen.getByText('Quanto é 1+1?')).toBeInTheDocument();

        // Verifica que o botão está desabilitado sem aluno selecionado
        const btnSalvar = screen.getByRole('button', { name: /Enviar Correção/i });
        expect(btnSalvar).toBeDisabled();

        // Seleciona o Aluno
        const selectAluno = screen.getByLabelText(/Escolha o aluno/i);
        await user.click(selectAluno);

        const optionAluno = await screen.findByText('Maria Silva');
        await user.click(optionAluno);

        // Verifica que o botão agora está habilitado
        await waitFor(() => {
            expect(btnSalvar).not.toBeDisabled();
        });

        // Preenche a resposta da dissertativa (texto)
        const textareaDissertativa = screen.getByLabelText(/Resposta do aluno \(transcrição\)/i);
        await user.clear(textareaDissertativa);
        await user.type(textareaDissertativa, 'Minha resposta sobre relatividade');

        // Preenche nota DECIMAL na dissertativa (Teste do requisito de float)
        // Busca o input de nota especificamente
        const inputNota = screen.getByLabelText(/Nota/i);

        // Use fireEvent.change para inputs do tipo number ao invés de user.type
        fireEvent.change(inputNota, { target: { value: '1.25' } });

        await waitFor(() => {
            expect(inputNota).toHaveValue(1.25);
        });

        // Preenche resposta da múltipla escolha (Q2)
        const radioB = screen.getByRole('radio', { name: /B\) 2/i });
        await user.click(radioB);

        await waitFor(() => {
            expect(radioB).toBeChecked();
        });

        // Envia o formulário
        const form = btnSalvar.closest('form');
        fireEvent.submit(form);

        // Aguarda a chamada do alert de sucesso
        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith("Correção salva com sucesso!");
        }, { timeout: 3000 });

        // Verifica se o fetch foi chamado com os dados certos
        const calls = fetch.mock.calls.filter(call =>
            call[0] && call[0].includes('correcao-manual')
        );

        expect(calls.length).toBeGreaterThan(0);

        const postCall = calls[0];
        expect(postCall[0]).toContain('/api/cursos/curso1/provas/prova1/correcao-manual');
        expect(postCall[1].method).toBe('POST');

        const body = JSON.parse(postCall[1].body);
        expect(body.alunoId).toBe('aluno1');
        expect(body.respostas).toHaveLength(2);

        // Verifica questão dissertativa com nota decimal
        const respostaDissertativa = body.respostas.find(r => r.questaoId === 'q1');
        expect(respostaDissertativa).toBeDefined();
        expect(respostaDissertativa.pontuacaoObtida).toBe(1.25);
        expect(respostaDissertativa.resposta).toBe('Minha resposta sobre relatividade');

        // Verifica questão objetiva
        const respostaObjetiva = body.respostas.find(r => r.questaoId === 'q2');
        expect(respostaObjetiva).toBeDefined();
        expect(respostaObjetiva.resposta).toBe('B');
        expect(respostaObjetiva.pontuacaoObtida).toBeUndefined(); // Calculada automaticamente
    }, 15000); // Timeout maior para operações assíncronas
});