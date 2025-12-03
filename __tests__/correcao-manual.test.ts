// Polyfills para NextRequest e outros objetos do ambiente Next.js
if (typeof global.Request === 'undefined') {
    global.Request = class Request {
        url: string;
        constructor(input: any) {
            this.url = typeof input === 'string' ? input : input?.url || '';
        }
    } as any;
}
if (typeof global.Response === 'undefined') {
    global.Response = class Response { } as any;
}

// Imports
import type { NextRequest } from 'next/server';

// Mocks
jest.mock('../src/lib/auth-helpers', () => ({
    getUserIdOrUnauthorized: jest.fn().mockResolvedValue('professor_id_123'),
}));

const mockUpsert = jest.fn().mockResolvedValue({ _id: 'resposta_criada' });
jest.mock('../src/services/db/respostaAluno.service', () => ({
    upsertRespostaAluno: mockUpsert,
}));

const mockFindOne = jest.fn();
jest.mock('../src/lib/mongodb', () => ({
    getDb: jest.fn().mockResolvedValue({
        collection: () => ({
            findOne: mockFindOne,
        }),
    }),
}));

jest.mock('mongodb', () => ({
    ObjectId: class {
        id: string;
        constructor(id: string) { this.id = id; }
        toString() { return this.id; }
    },
}));

// Tests
describe('API Correção Manual (Lógica de Correção)', () => {

    // Variável para armazenar a função POST carregada dinamicamente
    let POST: any;

    // Carrega o módulo da rota antes dos testes
    beforeAll(async () => {
        const routeModule = await import('../src/app/api/cursos/[id]/provas/[provaId]/correcao-manual/route');
        POST = routeModule.POST;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve calcular corretamente nota de Múltipla Escolha (Acerto)', async () => {
        // ARRANGE
        const provaSnapshot = {
            _id: 'prova_123',
            questoes: [
                {
                    _id: 'q_obj_1',
                    tipo: 'alternativa',
                    pontuacao: 2.0,
                    alternativas: [
                        { letra: 'A', correta: false },
                        { letra: 'B', correta: true }
                    ]
                }
            ]
        };
        mockFindOne.mockResolvedValue(provaSnapshot);

        // Simula o Request
        const req = {
            json: async () => ({
                alunoId: 'aluno_1',
                respostas: [
                    { questaoId: 'q_obj_1', resposta: 'B' },
                ]
            })
        } as unknown as NextRequest;

        // ACT
        const params = Promise.resolve({ id: 'curso_1', provaId: 'prova_123' });
        await POST(req, { params });

        // ASSERT
        expect(mockUpsert).toHaveBeenCalledWith('aluno_1', expect.objectContaining({
            questaoId: 'q_obj_1',
            pontuacaoObtida: 2.0,
            isCorrect: true
        }));
    });

    it('deve respeitar a nota manual decimal em questão Dissertativa', async () => {
        // ARRANGE
        const provaSnapshot = {
            _id: 'prova_123',
            questoes: [
                {
                    _id: 'q_diss_1',
                    tipo: 'dissertativa',
                    pontuacao: 5.0,
                    gabarito: 'Texto livre'
                }
            ]
        };
        mockFindOne.mockResolvedValue(provaSnapshot);

        const req = {
            json: async () => ({
                alunoId: 'aluno_1',
                respostas: [
                    {
                        questaoId: 'q_diss_1',
                        resposta: 'Minha resposta',
                        pontuacaoObtida: 1.25
                    },
                ]
            })
        } as unknown as NextRequest;

        // ACT
        const params = Promise.resolve({ id: 'curso_1', provaId: 'prova_123' });
        await POST(req, { params });

        // ASSERT
        expect(mockUpsert).toHaveBeenCalledWith('aluno_1', expect.objectContaining({
            questaoId: 'q_diss_1',
            pontuacaoObtida: 1.25,
            pontuacaoMaxima: 5.0
        }));
    });
});