/**
 * Simula um atraso de rede para testar estados de carregamento (Loading States).
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const questaoStatsService = {
  /**
   * Busca as estatísticas históricas de uma questão.
   * @param {string} idQuestao - O ID da questão.
   * @returns {Promise<object>} - Os dados formatados para o gráfico.
   */
  getById: async (idQuestao) => {
    await delay(1000); // Simula delay da API

    // MOCK INTELIGENTE PARA TESTES
    // O tipo de dado retornado depende do final do ID da questão.
    // Isso permite testar todos os gráficos apenas mudando a URL.
    
    // Caso 1: ID terminado em '1' -> Múltipla Escolha
    if (idQuestao.endsWith('1')) {
      return {
        tipo: 'multipla-escolha',
        dados: [
          { nome: 'A', Respostas: 15, correta: false },
          { nome: 'B', Respostas: 45, correta: true }, // Correta
          { nome: 'C', Respostas: 30, correta: false },
          { nome: 'D', Respostas: 10, correta: false },
        ]
      };
    }

    // Cenário 2: Dissertativa / Histograma (Se o ID terminar em '2')
    // Exemplo URL: .../questoes/102
    if (idQuestao.endsWith('2')) {
      return {
        tipo: 'dissertativa',
        dados: [
          { nome: '0 - 2.0', Respostas: 3 },
          { nome: '2.1 - 4.0', Respostas: 5 },
          { nome: '4.1 - 6.0', Respostas: 8 },
          { nome: '6.1 - 8.0', Respostas: 10 },
          { nome: '8.1 - 10.0', Respostas: 7 },
        ],
        // Metadados extras para os Chips de destaque
        meta: {
          qtdNotaZero: 2,
          qtdNotaDez: 4
        }
      };
    }

    // Cenário 3: V/F Agrupado (Se o ID terminar em '3')
    // Exemplo URL: .../questoes/103
    if (idQuestao.endsWith('3')) {
      return {
        tipo: 'verdadeiro-falso',
        dados: [
          { nome: 'I', acertos: 85, erros: 15 },
          { nome: 'II', acertos: 62, erros: 38 },
          { nome: 'III', acertos: 70, erros: 30 },
        ]
      };
    }

    // Cenário 4: Somatório (Se o ID terminar em '4')
    // Exemplo URL: .../questoes/104
    if (idQuestao.endsWith('4')) {
      return {
        tipo: 'somatorio',
        dados: [
          { nome: '03', Respostas: 10, correta: false },
          { nome: '05', Respostas: 25, correta: true }, // Correta
          { nome: '07', Respostas: 12, correta: false },
          { nome: '14', Respostas: 8, correta: false },
        ]
      };
    }

    // Padrão: Resposta Numérica (Frequência)
    // Para qualquer outro ID
    return {
      tipo: 'numerica',
      dados: [
        { nome: '15.5', Respostas: 12, correta: true },   // Correta
        { nome: '15500', Respostas: 8, correta: false }, // Erro comum
        { nome: '12.2', Respostas: 5, correta: false },
        { nome: 'Outros', Respostas: 2, correta: false },
      ]
    };
  }
};