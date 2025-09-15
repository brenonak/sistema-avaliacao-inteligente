'use client'; // Componente de cliente (interativo)

import { useState } from 'react';

export default function CriarQuestaoPage() {
  // Estado para guardar o valor do enunciado
  const [enunciado, setEnunciado] = useState('');
  
  // Estado para guardar as alternativas. Será uma lista.
  const [alternativas, setAlternativas] = useState([
    { texto: '', correta: true }, // Primeira alternativa correta, por padrão
    { texto: '', correta: false },
  ]);

  // Função que será chamada ao enviar o formulário
  const handleSubmit = (event) => {
    event.preventDefault(); // Impede o recarregamento da página

  // Validação: Checar se o enunciado está vazio
  if (enunciado.trim() === '') {
    alert('Por favor, preencha o enunciado da questão.');
    return; // Para a execução
  }

  // Validação: Checar se alguma alternativa está vazia
  if (alternativas.some(alt => alt.texto.trim() === '')) {
    alert('Todas as alternativas devem ser preenchidas.');
    return; // Para a execução
  }

  // Se tudo estiver certo, continua o código
  console.log({
    enunciado: enunciado,
    alternativas: alternativas,
  });
  
  alert('Questão enviada! Verifique o console.');
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-2xl font-bold mb-4">Criar Nova Questão</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        {/* Campo do Enunciado */}
        <div className="mb-4">
          <label htmlFor="enunciado" className="block text-gray-700 text-sm font-bold mb-2">
            Enunciado da Questão:
          </label>
          <textarea
            id="enunciado"
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
          />
        </div>

        {/* Campos das Alternativas */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Alternativas:</h2>
          {alternativas.map((alt, index) => (
            <div key={index} className="flex items-center mb-2">
              <input 
                type="radio" 
                name="alternativaCorreta" 
                checked={alt.correta}
                onChange={() => {
                  const novasAlternativas = alternativas.map((a, i) => ({...a, correta: i === index}));
                  setAlternativas(novasAlternativas);
                }}
              />
              <input
                type="text"
                value={alt.texto}
                onChange={(e) => {
                  const novoTexto = e.target.value;
                  const novasAlternativas = alternativas.map((a, i) => 
                    i === index ? { ...a, texto: novoTexto } : a
                  );
                  setAlternativas(novasAlternativas);
                }}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ml-2"
                placeholder={`Alternativa ${index + 1}`}
              />
              {/* Botão para remover alternativa */}
              <button
                type="button"
                className="ml-2 text-red-500 font-bold"
                onClick={() => {
                  if (alternativas.length > 2) {
                    const novasAlternativas = alternativas.filter((_, i) => i !== index);
                    // Se a alternativa removida era a correta, marca a primeira como correta
                    if (alt.correta) {
                      novasAlternativas[0].correta = true;
                    }
                    setAlternativas(novasAlternativas);
                  }
                }}
                disabled={alternativas.length <= 2}
                title="Remover alternativa"
              >
                🗑️
              </button>
            </div>
          ))}
          {/* Botão para adicionar alternativa */}
          <button
            type="button"
            className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
            onClick={() => setAlternativas([...alternativas, { texto: '', correta: false }])}
          >
            + Adicionar alternativa
          </button>
        </div>

        {/* Botão de Envio */}
        <button 
          type="submit" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Salvar Questão
        </button>
      </form>
    </main>
  );
}