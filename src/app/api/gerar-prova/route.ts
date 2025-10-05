import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.local` }); 


export async function POST(request: NextRequest) {
  try {
    console.log("Recebida requisição para gerar prova com Gemini...");

    const client = new MongoClient(process.env.MONGODB_URI!); 
    let provaJson;
    try {
      await client.connect();
      const database = client.db(process.env.MONGODB_DB); 
      const questoesCollection = database.collection("questoes");
      const pipeline = [{ $sample: { size: 5 } }];
      const questoesDaProva = await questoesCollection.aggregate(pipeline).toArray();

      if (questoesDaProva.length === 0) {
        throw new Error("Nenhuma questão foi encontrada no banco de dados.");
      }
      provaJson = {
        titulo: "Prova de Conhecimentos Gerais (Gerada com Gemini)",
        instrucoes: "Leia atentamente cada questão antes de responder.",
        questoes: questoesDaProva,
      };
    } finally {
      await client.close();
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.5-flash", 
      temperature: 0.2,
      maxOutputTokens: 8192,
    });

    const latexTemplate = `
      Você é um assistente especialista em LaTeX. Sua tarefa é converter um objeto JSON contendo os detalhes de uma prova em um documento LaTeX completo e bem formatado.
      Use a classe de documento 'exam' do LaTeX, que é ideal para criar provas.
      INSTRUÇÕES DE FORMATAÇÃO:
      1.  Comece com \\documentclass[12pt,a4paper]{{exam}}.
      2.  Inclua os pacotes: usepackage[utf8]{{inputenc}}, usepackage[T1]{{fontenc}}, usepackage{{amsmath}}.
      3.  Crie um título para a prova usando o título fornecido no JSON. Use \\begin{{center}}...\\end{{center}} para o título.
      4.  Adicione as instruções da prova após o título.
      5.  Inicie o ambiente de questões com \\begin{{questions}}.
      6.  Para cada questão no JSON:
          - Use o comando \\question.
          - Se o 'tipo' for 'multipla_escolha', use o ambiente \\begin{{oneparchoices}} ... \\end{{oneparchoices}} para as opções. Cada opção deve ser um item \\choice com quebra de linha a cada opção.
          - Se o 'tipo' for 'discursiva', adicione um espaço para a resposta, como \\fillwithdottedlines{{2cm}}.
      7.  Finalize com \\end{{questions}} e \\end{{document}}.
      8.  NÃO adicione comentários ou explicações no seu retorno. A saída deve ser APENAS o código LaTeX bruto.
      Abaixo está o JSON da prova:
      \`\`\`json
      {prova_json}
      \`\`\`
      CÓDIGO LATEX GERADO:
    `;

    const prompt = new PromptTemplate({
      template: latexTemplate,
      inputVariables: ["prova_json"],
    });

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const latexOutput = await chain.invoke({
      prova_json: JSON.stringify(provaJson, null, 2),
    });
    const nomeArquivo = `prova_gemini_${Date.now()}.tex`;

    // só funciona no diretório /tmp. Em desenvolvimento local, funciona normalmente.
    try {
      fs.writeFileSync(nomeArquivo, latexOutput);
    } catch (writeError) {
      console.warn("Não foi possível salvar o arquivo localmente:", writeError);
    }

    console.log(`Prova gerada: ${nomeArquivo}`);

    // Usamos NextResponse para enviar a resposta no padrão Next.js
    return NextResponse.json({ 
      success: true, 
      message: 'Prova gerada com sucesso via Gemini!',
      fileName: nomeArquivo,
      latexContent: latexOutput
    });

  } catch (error) {
    console.error("Erro ao gerar prova com Gemini:", error);
    // Retorna um erro com status 500
    return NextResponse.json(
      { success: false, message: 'Falha ao gerar a prova.' },
      { status: 500 }
    );
  }
}