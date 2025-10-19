import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash", 
  temperature: 0.7,
  maxOutputTokens: 2048,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // MODIFICAÇÃO: 'quantidade' agora é um campo obrigatório vindo do frontend.
    const { enunciado, alternativaCorreta, tags, quantidade } = body;

    if (!enunciado || !alternativaCorreta) {
      return NextResponse.json(
        { error: "Os campos 'enunciado' e 'alternativaCorreta' são obrigatórios." },
        { status: 400 }
      );
    }
    
    // MODIFICAÇÃO: Adicionada validação para a quantidade.
    if (typeof quantidade !== 'number' || quantidade <= 0) {
        return NextResponse.json(
            { error: "A quantidade de distratores a gerar deve ser um número positivo enviado pelo cliente." },
            { status: 400 }
        );
    }

    const template = `
Você é um especialista na criação de questões para avaliações educacionais.

Sua tarefa é criar alternativas **incorretas** (distratores) para uma questão de múltipla escolha, com base nas informações fornecidas.

**Tópico da Questão (Tags):** {tags}
**Enunciado da Questão:** {enunciado}
**Alternativa Correta (NÃO REPITA ESTA):** {alternativaCorreta}

**Diretrizes para os Distratores:**
1.  **Plausibilidade:** As alternativas incorretas devem ser verossímeis e relacionadas ao tópico.
2.  **Erros Comuns:** Devem se basear em erros conceituais comuns.
3.  **Consistência:** Devem ter um estilo semelhante à alternativa correta.
4.  **Quantidade:** Gere **exatamente {quantidade}** alternativas incorretas.

Retorne o resultado **exclusivamente** em formato JSON válido com a seguinte estrutura:
{{
  "alternativasIncorretas": ["distrator 1", "distrator 2", ...]
}}
`;

    const prompt = new PromptTemplate({
      template,
      inputVariables: ["enunciado", "alternativaCorreta", "tags", "quantidade"],
    });

    const outputParser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);
    
    const rawResponse = await chain.invoke({
      enunciado,
      alternativaCorreta,
      tags: tags ? tags.join(', ') : 'Geral',
      quantidade
    });

    console.log("Resposta bruta da IA:", rawResponse);

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

    // MODIFICAÇÃO: Retorna APENAS a lista de distratores.
    // O frontend agora é responsável por preencher os campos.
    return NextResponse.json({ alternativasIncorretas });

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