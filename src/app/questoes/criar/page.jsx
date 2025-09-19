'use client';

import { useState } from 'react';

export default function CriarQuestaoPage() {
  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState('alternativa'); // "alternativa" | "dissertativa" | "vf"
  const [alternativas, setAlternativas] = useState([
    { texto: '', correta: true },
    { texto: '', correta: false },
  ]);
  const [loading, setLoading] = useState(false);

  const indexToLetter = (i) => String.fromCharCode(65 + i); // 0->A, 1->B...

  const handleSubmit = async (event) => {
    event.preventDefault();

    // validações básicas
    if (enunciado.trim() === '') {
      alert('Por favor, preencha o enunciado da questão.');
      return;
    }
    if (tipo !== 'dissertativa') {
      if (alternativas.some((a) => a.texto.trim() === '')) {
        alert('Todas as alternativas devem ser preenchidas.');
        return;
      }
      if (!alternativas.some((a) => a.correta)) {
        alert('Marque uma alternativa como correta.');
        return;
      }
    }

    // monta o payload no formato esperado pela API
    const payload =
      tipo === 'dissertativa'
        ? {
            tipo,
            enunciado,
            alternativas: [], // dissertativa não usa alternativas
            gabarito: '', // opcional: pode coletar em outro campo
          }
        : {
            tipo, // "alternativa" ou "vf"
            enunciado,
            alternativas: alternativas.map((a, i) => ({
              letra: indexToLetter(i),
              texto: a.texto,
              correta: !!a.correta,
            })),
          };

    try {
      setLoading(true);
      const res = await fetch('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Falha ao salvar (HTTP ${res.status})`);
      }

      const created = await res.json();
      console.log('Criada:', created);
      alert('Questão salva com sucesso!');

      // limpar formulário
      setEnunciado('');
      setTipo('alternativa');
      setAlternativas([
        { texto: '', correta: true },
        { texto: '', correta: false },
      ]);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Erro ao salvar questão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-2xl font-bold mb-4">Criar Nova Questão</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        {/* Tipo da questão */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tipo de questão:
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="shadow border rounded w-full py-2 px-3"
          >
            <option value="alternativa">Múltipla escolha</option>
            <option value="vf">Verdadeiro ou Falso</option>
            <option value="dissertativa">Dissertativa</option>
          </select>
        </div>

        {/* Enunciado */}
        <div className="mb-4">
          <label htmlFor="enunciado" className="block text-gray-700 text-sm font-bold mb-2">
            Enunciado da Questão:
          </label>
          <textarea
            id="enunciado"
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            className="shadow border rounded w-full py-2 px-3"
            rows={4}
          />
        </div>

        {/* Alternativas (somente para alternativa/VF) */}
        {tipo !== 'dissertativa' && (
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2">Alternativas:</h2>
            {alternativas.map((alt, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  name="alternativaCorreta"
                  checked={alt.correta}
                  onChange={() => {
                    const novas = alternativas.map((a, i) => ({ ...a, correta: i === index }));
                    setAlternativas(novas);
                  }}
                />
                <input
                  type="text"
                  value={alt.texto}
                  onChange={(e) => {
                    const novoTexto = e.target.value;
                    const novas = alternativas.map((a, i) =>
                      i === index ? { ...a, texto: novoTexto } : a
                    );
                    setAlternativas(novas);
                  }}
                  className="shadow border rounded w-full py-2 px-3 ml-2"
                  placeholder={`Alternativa ${indexToLetter(index)}`}
                />
                <button
                  type="button"
                  className="ml-2 text-red-500 font-bold"
                  onClick={() => {
                    if (alternativas.length > 2) {
                      const novas = alternativas.filter((_, i) => i !== index);
                      if (alt.correta) novas[0].correta = true;
                      setAlternativas(novas);
                    }
                  }}
                  disabled={alternativas.length <= 2}
                  title="Remover alternativa"
                >
                  🗑️
                </button>
              </div>
            ))}
            <button
              type="button"
              className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
              onClick={() => setAlternativas([...alternativas, { texto: '', correta: false }])}
            >
              + Adicionar alternativa
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? 'Salvando...' : 'Salvar Questão'}
        </button>
      </form>
    </main>
  );
}