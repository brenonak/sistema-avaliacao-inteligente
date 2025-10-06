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
        titulo: "Prova de Conhecimentos Gerais (Gerada com Gemini)", // Deve ser incluido externamente quando houver a página dedicada de gerar provas
        instrucoes: "Leia atentamente cada questão antes de responder.", // Deve ser incluido externamente quando houver a página dedicada de gerar provas
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

    // Esqueleto do LaTeX fixo (início)
    const latexSkeletonStart = `
    \\documentclass[12pt, a4paper, addpoints]{exam}
    \\usepackage[utf8]{inputenc}
    \\usepackage[T1]{fontenc}
    \\usepackage{amsmath, amssymb}
    \\usepackage{geometry}
    \\geometry{a4paper, left=30mm, right=20mm, top=30mm, bottom=20mm}
    \\usepackage{xcolor}

    % REGRAS DE FORMATAÇÃO DE ESCOLHAS (FIXAS)
    \\renewcommand{\\thechoice}{\\Alph{choice}} % Usa A, B, C...
    \\renewcommand{\\choicelabel}{\\thechoice)} % Formato (A), (B), (C)

    \\begin{document}

    % TÍTULO DA PROVA
    \\begin{center}
          \\Large\\bfseries ${provaJson.titulo} \\\\
    \\end{center}
    \\vspace{0.5cm}

    % CABEÇALHO
    \\fbox{\\parbox{\\textwidth}{
        \\textbf{Aluno(a):} \\makebox[9cm]{\\hrulefill} \\quad \\textbf{Matrícula:} \\makebox[2cm]{\\hrulefill}
    }}
    \\vspace{0.5cm}

    % INSTRUÇÕES DA PROVA
    \\fbox{\\parbox{\\textwidth}{
        \\textbf{\\textcolor{red}{Instruções:}} \\\\
        \\itshape ${provaJson.instrucoes}
    }}
    \\vspace{0.5cm}

    % ÁREA DE QUESTÕES
    \\begin{questions}
    `;

    // Esqueleto do LaTeX fixo (fim)
    const latexSkeletonEnd = `
    \\end{questions}
    \\end{document}
    `;
    // Prompt para gerar o LaTeX somente das questões
    const latexTemplate = `
    Você é um assistante especialista em LaTeX. Sua **única tarefa** é ler o objeto JSON fornecido e gerar **SOMENTE** o código LaTeX para as questões, usando o ambiente 'exam', sem **NENHUM** texto adicional ou explicação.

    **NÃO INCLUA** \`\\documentclass\`, \`\\begin{document}\`, \`\\begin{questions}\`, \`\\end{questions}\` ou \`\\end{document}\` no seu resultado e não importe nenhum \`\\package{}\` ou afins.

      **[INSTRUÇÕES DE CONVERSÃO RIGOROSAS]**
      1.  **Formato de Saída:** O retorno deve ser **100% código LaTeX**. Não inclua NENHUMA saudação, explicação, introdução ou texto fora do código.
      2.  **SEM MARCAÇÃO:** NÃO use blocos de código Markdown (\`\`\`) no seu resultado.
      3.  **ESCOPO:** NÃO inclua \`\\documentclass\`, \`\\begin{document}\`, \`\\begin{questions}\` ou \`\\end{document}\`. Não importe \`\\package{}\`. Faça apenas a inserção das questões.
      4.  **Estrutura de Questão:** Use o comando \`\\question\` para iniciar cada questão.
      5.  **Regras de Formatação por Tipo:**
          * **Tipo 'alternativa'**: Use o ambiente **\`\\begin{choices}\` e \`\\end{choices}\`**. Cada opção deve ser \`\\choice <texto da alternativa>\`.
          * **Tipo 'vf' (Verdadeiro/Falso)**: Use o ambiente **\`\\begin{checkboxes}\` e \`\\end{checkboxes}\`**. Cada opção deve ser \`\\choice <texto da alternativa>\`.
          * **Tipo 'discursiva'**: Após o enunciado da questão, adicione **\`\\fillwithlines{5cm}\`** para o espaço de resposta.

      6.  **Notação Matemática:** Se o enunciado ou as alternativas contiverem fórmulas, variáveis ou símbolos matemáticos, use o ambiente matemático (ex: \`$x^2$\` ou \`$$\\frac{1}{2}$$\`).

      **[JSON DA PROVA PARA CONVERSÃO]**
      \`\`\`json
      {prova_json}
      \`\`\`

      CÓDIGO LATEX GERADO (APENAS QUESTÕES):
      `;

    const prompt = new PromptTemplate({
      template: latexTemplate,
      inputVariables: ["prova_json"],
    });

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const latexQuestions = await chain.invoke({
      prova_json: JSON.stringify(provaJson, null, 2),
    });

    // Concatena o esqueleto fixo com as questões geradas
    const fullLatexOutput = `${latexSkeletonStart}${latexQuestions}${latexSkeletonEnd}`;

    const nomeArquivo = `prova_gemini_${Date.now()}.tex`;

    console.log(`Prova gerada: ${nomeArquivo}`);

    // Usamos NextResponse para enviar a resposta no padrão Next.js
    return NextResponse.json({ 
      success: true, 
      message: 'Prova gerada com sucesso via Gemini!',
      fileName: nomeArquivo,
      latexContent: fullLatexOutput
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