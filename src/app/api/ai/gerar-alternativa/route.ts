import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// A inicialização do modelo permanece a mesma.
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash", // Recomendo usar um modelo mais recente se possível
  temperature: 0.7, // Aumentei a temperatura para mais criatividade nas alternativas
  maxOutputTokens: 2048,
});


function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Troca de elementos
    }
    return array;
}


export async function POST(req: Request) {
  try {
    // --- 1. ENTRADAS MODIFICADAS ---
    // Agora esperamos 'enunciado' e 'alternativaCorreta'.
    const body = await req.json();
    const { enunciado, alternativaCorreta, tags, quantidade = 3 } = body;

    // Validação das novas entradas obrigatórias.
    if (!enunciado || !alternativaCorreta) {
      return NextResponse.json(
        { error: "Os campos 'enunciado' e 'alternativaCorreta' são obrigatórios." },
        { status: 400 }
      );
    }

    // --- 2. NOVO PROMPT TEMPLATE ---
    // Este é o novo prompt, focado em criar distratores plausíveis.
    const template = `
Você é um especialista na criação de questões para avaliações educacionais.

Sua tarefa é criar alternativas **incorretas** (distratores) para uma questão de múltipla escolha, com base no enunciado e na alternativa correta fornecida.

**Diretrizes para os Distratores:**
1.  **Plausibilidade:** As alternativas incorretas devem ser verossímeis e relacionadas ao tópico do enunciado.
2.  **Erros Comuns:** Devem, idealmente, se basear em erros conceituais comuns que um aluno poderia cometer.
3.  **Consistência:** Devem ter um estilo, formato e complexidade semelhantes à alternativa correta.
4.  **Quantidade:** Gere exatamente {quantidade} alternativas incorretas.

Retorne o resultado **exclusivamente** em formato JSON válido, com a seguinte estrutura:
{{
  "alternativasIncorretas": ["distrator 1", "distrator 2", ...]
}}

---

**Enunciado da Questão:**
{enunciado}

**Alternativa Correta:**
{alternativaCorreta}
`;

    const prompt = new PromptTemplate({
    template,
    inputVariables: ["enunciado", "alternativaCorreta", "tags", "quantidade"],
    });

    // A execução da cadeia (chain) permanece conceitualmente a mesma.
    const outputParser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);
    
    const rawResponse = await chain.invoke({
    enunciado,
    alternativaCorreta,
    tags: tags ? tags.join(', ') : 'Geral', // Envia as tags
    quantidade
    });

    console.log("Resposta bruta da IA:", rawResponse);

    // A lógica para extrair JSON da resposta é robusta e foi mantida.
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawResponse);
    } catch {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("A resposta da IA não contém um JSON válido.");
      }
    }
    
    const { alternativasIncorretas } = parsedResponse;

    if (!alternativasIncorretas || !Array.isArray(alternativasIncorretas)) {
        throw new Error("O JSON retornado pela IA não contém o array 'alternativasIncorretas'.");
    }

    // --- 3. MONTAGEM DA RESPOSTA FINAL ---
    // Combinamos a alternativa correta com as incorretas geradas.
    const todasAlternativas = [alternativaCorreta, ...alternativasIncorretas];

    // Embaralhamos o array para que a resposta correta não tenha uma posição fixa.
    const alternativasEmbaralhadas = shuffleArray(todasAlternativas);

    const result = {
        enunciado: enunciado,
        alternativaCorreta: alternativaCorreta, // opcional, mas útil para o front-end
        alternativas: alternativasEmbaralhadas,
    };
    
    console.log("Resultado processado:", result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Erro ao gerar alternativas:", error);
    return NextResponse.json(
      { 
        error: "Erro no servidor ao gerar alternativas com IA.",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}