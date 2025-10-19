import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash",
  temperature: 0.3,
  maxOutputTokens: 2048,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { enunciado, alternativas, afirmacoes, proposicoes, gabarito } = body;

    if (!enunciado) {
      return NextResponse.json(
        { error: "Campo 'enunciado' é obrigatório." },
        { status: 400 }
      );
    }

    // Monta o conteúdo a ser revisado dinamicamente
    let conteudoAdicional = "";
    
    if (alternativas && alternativas.length > 0) {
      conteudoAdicional += "\n\nAlternativas:\n";
      alternativas.forEach((alt: string, i: number) => {
        conteudoAdicional += `${i + 1}. ${alt}\n`;
      });
    }

    if (afirmacoes && afirmacoes.length > 0) {
      conteudoAdicional += "\n\nAfirmações:\n";
      afirmacoes.forEach((afirm: string, i: number) => {
        conteudoAdicional += `${i + 1}. ${afirm}\n`;
      });
    }

    if (proposicoes && proposicoes.length > 0) {
      conteudoAdicional += "\n\nProposições:\n";
      proposicoes.forEach((prop: string, i: number) => {
        conteudoAdicional += `${i + 1}. ${prop}\n`;
      });
    }

    if (gabarito) {
      conteudoAdicional += "\n\nGabarito:\n" + gabarito;
    }

    const template = `
Você é um revisor especializado de questões educacionais.

Sua tarefa é revisar o texto fornecido corrigindo **apenas**:
- Erros ortográficos e de acentuação
- Erros gramaticais e de pontuação
- Problemas de clareza e coesão textual
- Concordância nominal e verbal

**IMPORTANTE:**
- NÃO altere o conteúdo técnico, conceitos ou significado pedagógico
- NÃO mude números, fórmulas ou dados específicos
- NÃO adicione nem remova informações
- Preserve o tom e o estilo original
- Mantenha a estrutura das frases quando possível

Retorne o resultado em formato JSON válido com a seguinte estrutura:
{{
  "enunciadoRevisado": "texto do enunciado revisado",
  "alternativasRevisadas": ["alt1 revisada", "alt2 revisada", ...],
  "afirmacoesRevisadas": ["afirm1 revisada", "afirm2 revisada", ...],
  "proposicoesRevisadas": ["prop1 revisada", "prop2 revisada", ...],
  "gabaritoRevisado": "gabarito revisado"
}}

**ATENÇÃO:** Inclua no JSON apenas os campos que foram fornecidos. Se não houver alternativas, não inclua o campo "alternativasRevisadas".

---

TEXTO PARA REVISÃO:

Enunciado: {enunciado}
{conteudoAdicional}
`;

    const prompt = new PromptTemplate({
      template,
      inputVariables: ["enunciado", "conteudoAdicional"],
    });

    // Executa o modelo
    const outputParser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);
    
    const rawResponse = await chain.invoke({
      enunciado,
      conteudoAdicional,
    });

    console.log("Resposta bruta da IA:", rawResponse);

    // Extrai e valida o JSON da resposta
    let revisedData;
    try {
      // Tenta fazer parse direto
      revisedData = JSON.parse(rawResponse);
    } catch {
      // Se falhar, tenta extrair JSON de dentro de markdown ou texto
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        revisedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Resposta da IA não contém JSON válido");
      }
    }

    // Monta a resposta apenas com os campos que foram enviados
    const result: any = {
      enunciadoRevisado: revisedData.enunciadoRevisado || enunciado,
    };

    if (alternativas && alternativas.length > 0) {
      result.alternativasRevisadas = revisedData.alternativasRevisadas || alternativas;
    }

    if (afirmacoes && afirmacoes.length > 0) {
      result.afirmacoesRevisadas = revisedData.afirmacoesRevisadas || afirmacoes;
    }

    if (proposicoes && proposicoes.length > 0) {
      result.proposicoesRevisadas = revisedData.proposicoesRevisadas || proposicoes;
    }

    if (gabarito) {
      result.gabaritoRevisado = revisedData.gabaritoRevisado || gabarito;
    }

    console.log("Resultado processado:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao revisar questão:", error);
    return NextResponse.json(
      { 
        error: "Erro ao revisar questão com IA.",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}