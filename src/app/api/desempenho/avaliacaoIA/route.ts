import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";

dotenv.config({ path: `.env.local` });

/**
 * POST /api/desempenho/avaliacaoIA
 * Recebe um JSON com estatísticas da turma e retorna insights gerados por IA.
 */
export async function POST(request: NextRequest) {
  try {
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;

    const body = await request.json();
    const { dadosTurma, contexto } = body;

    if (!dadosTurma) {
      return NextResponse.json(
        { success: false, message: 'O objeto "dadosTurma" é obrigatório.' },
        { status: 400 }
      );
    }

    console.log(`Gerando análise de desempenho para o usuário ${userIdOrError}...`);

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.5-flash", 
      temperature: 0.3, // Temperatura mais baixa para ser mais analítico e menos criativo
      maxOutputTokens: 2048,
    });

    const analysisTemplate = `
    Você é um assistente especialista em Análise de Dados Educacionais e Pedagogia.
    Sua tarefa é analisar os dados de desempenho de uma turma e fornecer insights acionáveis para o professor.

    **CONTEXTO DA AVALIAÇÃO:**
    {contexto}

    **DADOS ESTATÍSTICOS DA TURMA:**
    \`\`\`json
    {json_dados}
    \`\`\`

    Com base APENAS nos dados fornecidos, gere um relatório conciso em formato Markdown contendo:
    1.  **Visão Geral:** Um breve resumo do desempenho geral da turma (média, desvio padrão se houver, ou percepção geral).
    2.  **Pontos Fortes:** Tópicos ou questões onde a turma teve desempenho excepcional.
    3.  **Pontos de Atenção (Gaps de Aprendizado):** Identifique padrões de erro. Onde os alunos estão falhando? Existe algum conceito específico que parece não ter sido compreendido?
    4.  **Sugestões de Intervenção:** Sugira 2 a 3 ações práticas que o professor pode tomar para melhorar o desempenho nesses pontos fracos (ex: revisão de conteúdo, novos exercícios, mudança de abordagem).

    **Regras:**
    - Seja direto e profissional.
    - Use listas (bullet points) para facilitar a leitura.
    - Não invente dados que não estão no JSON.
    - Fale diretamente com o professor.

    RELATÓRIO DE ANÁLISE:
    `;

    const prompt = new PromptTemplate({
      template: analysisTemplate,
      inputVariables: ["contexto", "json_dados"],
    });

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const contextoTexto = contexto || "Avaliação geral de conhecimentos.";
    
    const analysisOutput = await chain.invoke({
      contexto: contextoTexto,
      json_dados: JSON.stringify(dadosTurma, null, 2),
    });

    return NextResponse.json({
      success: true,
      analysis: analysisOutput
    });

  } catch (error) {
    console.error("Erro ao analisar desempenho:", error);
    return NextResponse.json(
      { success: false, message: 'Falha ao processar a análise de desempenho.' },
      { status: 500 }
    );
  }
}