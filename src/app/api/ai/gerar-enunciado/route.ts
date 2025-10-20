import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash", 
  temperature: 0.5,
  maxOutputTokens: 2048,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { alternativas, tags, enunciadoInicial } = body;

    if (!tags || tags.length === 0) {
      return NextResponse.json(
        { error: "O campo 'tags' é obrigatório para fornecer o contexto da questão." },
        { status: 400 }
      );
    }


    const template = `
Você é um especialista em design instrucional e criação de questões para avaliações.

Sua tarefa é gerar um enunciado de questão claro, conciso e pedagogicamente sólido, com base nos dados fornecidos.

**Instruções:**
1.  Analise os 'tags' de tópico para entender o contexto.
2.  **Se uma lista de 'alternativas' for fornecida**, sua tarefa é criar uma questão de **múltipla escolha**. Analise as alternativas, infira qual é a correta e formule uma pergunta cuja resposta seja essa alternativa.
3.  **Se a lista de 'alternativas' estiver vazia ou ausente**, sua tarefa é criar uma questão **dissertativa** ou de resposta curta, baseada exclusivamente nos 'tags' e no 'enunciadoInicial' (se houver).
4.  Se um 'enunciadoInicial' for fornecido, use-o como inspiração ou ponto de partida. Caso contrário, crie o enunciado do zero.
5.  O enunciado gerado deve ser direto e inequívoco.

Retorne o resultado **exclusivamente** em formato JSON válido com a seguinte estrutura:
{{
  "enunciadoGerado": "O texto do enunciado que você criou."
}}

---

**DADOS DE ENTRADA:**

**Tags do Tópico:** {tags}
{promptAlternativas}
**Enunciado Inicial (se houver):** {enunciadoInicial}
`;


    const formattedTags = tags.join(", ");
    

    let promptAlternativas = "";
    if (alternativas && alternativas.length > 0) {
      promptAlternativas = `**Alternativas Fornecidas:**\n${alternativas.map((alt: string, i: number) => `${i + 1}. ${alt}`).join("\n")}`;
    }


    const prompt = new PromptTemplate({
      template,
      inputVariables: ["tags", "promptAlternativas", "enunciadoInicial"],
    });

    const outputParser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);
    
    const rawResponse = await chain.invoke({
      tags: formattedTags,
      promptAlternativas: promptAlternativas,
      enunciadoInicial: enunciadoInicial || "Nenhum",
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
    
    const { enunciadoGerado } = parsedResponse;

    if (!enunciadoGerado) {
        throw new Error("O JSON retornado pela IA não contém o campo 'enunciadoGerado'.");
    }

    const result = {
        enunciadoGerado,
    };
    
    console.log("Resultado processado:", result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Erro ao gerar enunciado:", error);
    return NextResponse.json(
      { 
        error: "Erro no servidor ao gerar enunciado com IA.",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}