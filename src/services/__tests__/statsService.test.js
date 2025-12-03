import { questaoStatsService } from '../statsService';

describe('Stats Service Integration', () => {
  
  // Limpa os mocks antes de cada teste para não haver interferência
  beforeEach(() => {
    global.fetch.mockClear();
  });

  it('deve chamar a API correta e retornar os dados formatados', async () => {
    // O Mock da Resposta da API. O que o "Back-end" devolveria se estivesse rodando
    const mockResponseData = {
      tipo: 'dissertativa',
      dados: [
        { nome: '0 - 2.0', Respostas: 3 },
        { nome: '8.1 - 10.0', Respostas: 7 }
      ],
      meta: {
        qndNotaMinima: 2,
        qndNotaMaxima: 4
      }
    };

    // CONFIGURAÇÃO DO FETCH MOCK
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    });

    const idSimulado = '102';
    const resultado = await questaoStatsService.getById(idSimulado);

    //VERIFICAÇÕES
    
    // Verifica se o fetch foi chamado com a URL CORRETA
    expect(global.fetch).toHaveBeenCalledWith(`/api/questoes/${idSimulado}/estatisticas`);

    // Verifica se o serviço retornou os dados
    expect(resultado.tipo).toBe('dissertativa');
    expect(resultado.meta).toHaveProperty('qndNotaMinima');
    expect(resultado).toEqual(mockResponseData);
  });

  it('deve lançar um erro quando a resposta da API não for ok', async () => {
    // Cenário de Erro 404 ou 500
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Questão não encontrada' }),
    });

    // Verifica se a função explode
    await expect(questaoStatsService.getById('999'))
      .rejects
      .toThrow('Questão não encontrada');
  });
});