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
    global.Response = class Response {
        static json(data: any, init?: any) {
            return { data, status: init?.status || 200 };
        }
    } as any;
}

// Mock do NextResponse antes de importar
class MockNextResponse {
    data: any;
    status: number;
    constructor(data: any, status: number) {
        this.data = data;
        this.status = status;
    }
    static json(data: any, init?: any) {
        return new MockNextResponse(data, init?.status || 200);
    }
}

jest.mock('next/server', () => ({
    NextResponse: MockNextResponse
}));

// Imports
import type { NextRequest } from 'next/server';

// Mocks
jest.mock('../src/lib/auth-helpers', () => ({
    getUserIdOrUnauthorized: jest.fn().mockResolvedValue('professor_id_123'),
}));

// Mock completo do SubmissoesService
const mockRegistrarResposta = jest.fn().mockResolvedValue(undefined);
const mockIniciarSubmissao = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/services/db/submissoes.service', () => ({
    registrarResposta: mockRegistrarResposta,
    iniciarSubmissao: mockIniciarSubmissao,
}));

// Mock do MongoDB
const mockFindOne = jest.fn();
jest.mock('../src/lib/mongodb', () => ({
    getDb: jest.fn().mockResolvedValue({
        collection: () => ({
            findOne: mockFindOne,
        }),
    }),
}));

// Mock do ObjectId
jest.mock('mongodb', () => ({
    ObjectId: class {
        id: string;
        constructor(id?: string) { 
            this.id = id || 'mock_id'; 
        }
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

        // ASSERT - Verifica que registrarResposta foi chamado com os parâmetros corretos
        expect(mockRegistrarResposta).toHaveBeenCalledTimes(1);
        expect(mockRegistrarResposta).toHaveBeenCalledWith(
            'aluno_1',
            'prova_123',
            'PROVA',
            expect.objectContaining({
                pontuacaoObtida: 2.0,
                isCorrect: true
            })
        );
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
                alunoId: 'aluno_2',
                respostas: [
                    { 
                        questaoId: 'q_diss_1', 
                        resposta: 'Minha resposta dissertativa', 
                        pontuacaoObtida: 3.5  // Campo correto para nota manual
                    }
                ]
            })
        } as unknown as NextRequest;

        // ACT
        const params = Promise.resolve({ id: 'curso_1', provaId: 'prova_123' });
        await POST(req, { params });

        // ASSERT - Verifica que registrarResposta foi chamado com a nota manual
        expect(mockRegistrarResposta).toHaveBeenCalledTimes(1);
        expect(mockRegistrarResposta).toHaveBeenCalledWith(
            'aluno_2',
            'prova_123',
            'PROVA',
            expect.objectContaining({
                pontuacaoObtida: 3.5
            })
        );
    });
});