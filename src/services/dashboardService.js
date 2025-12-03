export const dashboardService = {
  getProvaAnalytics: async (provaId) => {
    // Chama a rota API recém-criada que aceita apenas provaId
    const res = await fetch(`/api/cursos/-/provas/${provaId}/analytics`);

    if (!res.ok) {
      throw new Error('Falha ao carregar dados da dashboard.');
    }

    return await res.json();
  }
};