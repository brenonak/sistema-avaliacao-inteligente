/**
 * Serviço de acesso a dados para Estatísticas de Questões
 */
export const questaoStatsService = {
  /**
   * Busca as estatísticas históricas de uma questão.
   * @param {string} idQuestao - O ID da questão.
   * @returns {Promise<object>} - Os dados formatados para o gráfico.
   */
  getById: async (idQuestao) => {
    try {
      const res = await fetch(`/api/questoes/${idQuestao}/estatisticas`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido no servidor' }));
        throw new Error(errorData.message || `Erro ${res.status}`);
      }
      
      const data = await res.json();
      return data;

    } catch (error) {
      console.error("Erro no statsService:", error);
      throw error;
    }
  }
};