"use client";

import { useEffect, useState } from 'react';

export default function ListarQuestoesPage() {
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchQuestoes() {
      try {
        setLoading(true);
        const res = await fetch('/api/questoes');
        if (!res.ok) throw new Error('Erro ao buscar questões');
        const data = await res.json();
        setQuestoes(data.items || []);
      } catch (err) {
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestoes();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-2xl font-bold mb-6">Questões Cadastradas</h1>
      <div className="w-full max-w-2xl">
        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && questoes.length === 0 && <p>Nenhuma questão cadastrada.</p>}
        {questoes.map((questao, idx) => (
          <div key={questao.id || questao._id || idx} className="mb-4 p-4 border rounded shadow">
            <p className="font-semibold">{questao.enunciado}</p>
            <ul className="list-disc pl-5 mt-2">
              {questao.alternativas?.map((alt, index) => (
                <li key={index} className={alt.correta ? 'font-bold text-green-600' : ''}>
                  {alt.texto} {alt.correta && '(Correta)'}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}