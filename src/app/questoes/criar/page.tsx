'use client'; // Componente de cliente (interativo)

import React from 'react';
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
    
    // Validação aqui
    
    // Dados no console
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

        {/* Campos das Alternativas (aqui a mágica acontece) */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Alternativas:</h2>
          {/* Nós vamos mapear o estado 'alternativas' para criar os campos de input */}
          {alternativas.map((alt, index) => (
            <div key={index} className="flex items-center mb-2">
              <input 
                type="radio" 
                name="alternativaCorreta" 
                checked={alt.correta}
                // Lógica para marcar qual é a correta
                onChange={() => {
                    const novasAlternativas = alternativas.map((a, i) => ({...a, correta: i === index}));
                    setAlternativas(novasAlternativas);
                }}
              />
              <input
                type="text"
                value={alt.texto}
                // Lógica para atualizar o texto da alternativa específica
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
            </div>
          ))}
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