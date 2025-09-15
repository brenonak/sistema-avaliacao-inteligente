// Dados Falsos (Mocks) - depois virá do backend
const DADOS_DAS_QUESTOES = [
  {
    id: 1,
    enunciado: 'Qual framework de back-end foi escolhido para o projeto?',
    alternativas: [
      { texto: 'Django', correta: false },
      { texto: 'FastAPI', correta: true },
      { texto: 'Flask', correta: false },
    ]
  },
  {
    id: 2,
    enunciado: 'Qual banco de dados foi escolhido inicialmente?',
    alternativas: [
      { texto: 'PostgreSQL', correta: false },
      { texto: 'MySQL', correta: false },
      { texto: 'MongoDB', correta: true },
    ]
  }
];

export default function ListarQuestoesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-2xl font-bold mb-6">Questões Cadastradas</h1>
      <div className="w-full max-w-2xl">
        {DADOS_DAS_QUESTOES.map((questao) => (
          <div key={questao.id} className="mb-4 p-4 border rounded shadow">
            <p className="font-semibold">{questao.enunciado}</p>
            <ul className="list-disc pl-5 mt-2">
              {questao.alternativas.map((alt, index) => (
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