/**
 * Simula o delay da rede
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const dashboardService = {
  /**
   * Busca os dados analíticos consolidados de uma Prova/Atividade.
   * @param {string} idProva - O ID da prova.
   */
  getProvaAnalytics: async (idProva) => {
    console.log(`[MockService] Buscando analytics para a prova ID: ${idProva}`);
    await delay(1200); // Simula um carregamento um pouco mais pesado

    // ------------------------------------------------------------------
    // CENÁRIO 1: Turma com Desempenho BOM (Padrão)
    // ------------------------------------------------------------------
    if (!idProva.endsWith('2')) {
      return {
        // Cards de Resumo
        resumo: {
          mediaGeral: 7.8,
          totalAlunos: 42,
          maiorNota: 10.0,
          menorNota: 3.5,
          taxaAprovacao: 85, // 85%
        },

        // 2. Dados para o Histograma de Distribuição de Notas
        distribuicaoNotas: {
          dados: [
            { nome: '0 - 2.0', Respostas: 0 },
            { nome: '2.1 - 4.0', Respostas: 4 },
            { nome: '4.1 - 6.0', Respostas: 8 },
            { nome: '6.1 - 8.0', Respostas: 18 },
            { nome: '8.1 - 10.0', Respostas: 12 },
          ],
          meta: {
            qndNotaMinima: 1, // Ninguém tirou zero
            qndNotaMaxima: 5, // 5 pessoas gabaritaram
          }
        },

        // Dados para o Gráfico de Desempenho por Questão
        // Mockado como se fosse um gráfico de frequência, onde "Respostas" é a % de acerto
        desempenhoPorQuestao: [
          { nome: 'Q1', Respostas: 95, correta: true }, // Muito fácil (Verde)
          { nome: 'Q2', Respostas: 80, correta: true },
          { nome: 'Q3', Respostas: 45, correta: false }, // Difícil (Vermelho)
          { nome: 'Q4', Respostas: 60, correta: true },
          { nome: 'Q5', Respostas: 30, correta: false }, // Muito difícil
        ]
      };
    }

    // ------------------------------------------------------------------
    // CENÁRIO 2: Turma com Desempenho RUIM (ID termina em '2')
    // ------------------------------------------------------------------
    return {
      resumo: {
        mediaGeral: 4.2,
        totalAlunos: 35,
        maiorNota: 7.5,
        menorNota: 0.0,
        taxaAprovacao: 30,
      },
      distribuicaoNotas: {
        dados: [
          { nome: '0 - 2.0', Respostas: 12 },
          { nome: '2.1 - 4.0', Respostas: 10 },
          { nome: '4.1 - 6.0', Respostas: 8 },
          { nome: '6.1 - 8.0', Respostas: 5 },
          { nome: '8.1 - 10.0', Respostas: 0 },
        ],
        meta: {
          qndNotaMinima: 3, 
          qndNotaMaxima: 0, 
        }
      },
      desempenhoPorQuestao: [
        { nome: 'Q1', Respostas: 50, correta: true },
        { nome: 'Q2', Respostas: 20, correta: false },
        { nome: 'Q3', Respostas: 15, correta: false },
        { nome: 'Q4', Respostas: 40, correta: false },
        { nome: 'Q5', Respostas: 60, correta: true },
      ]
    };
  }
};