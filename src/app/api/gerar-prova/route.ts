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
      const recursosCollection = database.collection("recursos");

      // Buscar as 5 questões mais recentes
      const questoesDaProva = await questoesCollection
        .find()
        .sort({ _id: -1 })
        .limit(5)
        .toArray();

      if (questoesDaProva.length === 0) {
        throw new Error("Nenhuma questão foi encontrada no banco de dados.");
      }

      // Buscar URLs dos recursos (imagens) para cada questão
      const questoesComRecursos = await Promise.all(
        questoesDaProva.map(async (questao) => {
          // Se não há recursos, retorna a questão sem modificações
          if (!questao.recursos || questao.recursos.length === 0) {
            return questao;
          }

          try {
            // Buscar os recursos no banco
            const recursos = await recursosCollection
              .find({ url: { $exists: true } })
              .toArray();

            // Filtrar apenas os recursos que pertencem a esta questão
            const recursosFileNames = recursos
              .filter(r => questao.recursos.includes(r._id.toString()) || questao.recursos.includes(r.url))
              .map(r => r.file_name || r.filename || 'imagem.jpg'); // Usa file_name do MongoDB

            return {
              ...questao,
              recursosFileNames // Adiciona array com nomes de arquivos do MongoDB
            };
          } catch (err) {
            console.error(`Erro ao buscar recursos da questão ${questao._id}:`, err);
            return questao; // Retorna questão sem recursos em caso de erro
          }
        })
      );

      provaJson = {
        titulo: "Prova de Conhecimentos Gerais (Gerada com Gemini)", // Futuramente, esses campos devem ser definidos na página de geração de provas
        instrucoes: "Leia atentamente cada questão antes de responder.",
        questoes: questoesComRecursos,
      };
      
      console.log(`Total de questões: ${questoesComRecursos.length}`);
      console.log(`Questões com imagens: ${questoesComRecursos.filter(q => q.recursosFileNames && q.recursosFileNames.length > 0).length}`);
      
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
    \\usepackage{tikz}
    \\usepackage{adjustbox}
    \\usepackage{graphicx}

    % REGRAS DE FORMATAÇÃO DE ESCOLHAS (FIXAS)
    \\renewcommand{\\thechoice}{\\Alph{choice}} % Usa A, B, C...
    \\renewcommand{\\choicelabel}{\\thechoice)} % Formato (A), (B), (C)

    % AMBIENTE PARA QUESTÃO SOMATÓRIO
    \\newcounter{somatorioitem} % Contador para as opções
    \\setcounter{somatorioitem}{0} % Inicializa o contador

    % Comando para gerar o rótulo da opção (potência de 2)
    \\newcommand{\\somatorioitemlabel}{
        \\stepcounter{somatorioitem}% 1, 2, 3, ...
        % Calcula 2^(n-1) e armazena como float
        \\pgfmathsetmacro{\\poweroftwo}{2^(\\value{somatorioitem}-1)}%
        % IMPRIME O RESULTADO CONVERTENDO PARA INTEIRO
        ( \\pgfmathprintnumber[int detect]{\\poweroftwo} )
    }

    % Ambiente para a Questão Somatório
    \\newenvironment{somatoriochoices}{
        % O ambiente simula uma lista sem marcadores
        \\list{\\somatorioitemlabel}{% Usa o novo rótulo (potência de 2)
            \\setlength{\\labelwidth}{4em}% Ajusta o espaço para o rótulo
            \\setlength{\\leftmargin}{\\labelwidth}% Ajusta a margem esquerda
            \\addtolength{\\leftmargin}{\\labelsep}% Adiciona o espaço do separador
            \\setlength{\\itemsep}{0.5ex}% Espaço entre itens
            \\setlength{\\parsep}{0.3ex}% Espaço entre parágrafos
            \\setlength{\\topsep}{0.3ex}% Espaço antes do primeiro item
            \\renewcommand{\\makelabel}[1]{\\hss##1}
        }
        \\setcounter{somatorioitem}{0}% Reinicia o contador no início
    }{
        \\endlist
    }

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

    **NÃO INCLUA** \`\\documentclass\`, \`\\begin{{document}}\`, \`\\begin{{questions}}\`, \`\\end{{questions}}\` ou \`\\end{{document}}\` no seu resultado e não importe nenhum \`\\package{{}}\` ou afins.

      **[INSTRUÇÕES DE CONVERSÃO RIGOROSAS]**
      1.  **Formato de Saída:** O retorno deve ser **100% código LaTeX**. Não inclua NENHUMA saudação, explicação, introdução ou texto fora do código.
      2.  **SEM MARCAÇÃO:** NÃO use blocos de código Markdown (\`\`\`) no seu resultado.
      3.  **ESCOPO:** NÃO inclua \`\\documentclass\`, \`\\begin{{document}}\`, \`\\begin{{questions}}\` ou \`\\end{{document}}\`. Não importe \`\\package{{}}\`. Faça apenas a inserção das questões.
      4.  **Estrutura de Questão:** Use o comando \`\\question\` para iniciar cada questão.
      5.  **Regras de Formatação por Tipo:**
          * **Tipo 'alternativa'**: Use o ambiente **\`\\begin{{choices}}\` e \`\\end{{choices}}\`**. Cada opção deve ser \`\\choice <texto da alternativa>\`.
          * **Tipo 'vf' (Verdadeiro/Falso)**: Use o ambiente **\`\\begin{{choices}}\` e \`\\end{{choices}}\`**. Cada opção deve ser \`\\item[($\\quad$)] <texto da alternativa>\`.
          * **Tipo 'discursiva'**: Após o enunciado da questão, adicione **\`\\fillwithlines{{5cm}}\`** para o espaço de resposta.
          * **Tipo 'proposicoes'**: Use o ambiente **\`\\begin{{somatoriochoices}}\` e \`\\end{{somatoriochoices}}\`**. Cada opção deve ser \`\\item <texto da alternativa>\`. Na linha abaixo de \`\\end{{choices}}\` insira \`\\answerline\`.
          * **Tipo 'numerica'**: Após o enunciado da questão, adicione **\`\\answerline\`** para o espaço de resposta.
      6.  **Notação Matemática:** Se o enunciado ou as alternativas contiverem fórmulas, variáveis ou símbolos matemáticos, use o ambiente matemático (ex: \`$x^2$\` ou \`$\\frac{{1}}{{2}}$\`) sem usar fórmulas centralizadas (SEMPRE fórmulas inline com cifrão simples). Tenha uma atenção especial para frações, que devem usar o comando \`$\\frac{{numerador}}{{denominador}}$\`. Também verifique se há fórmulas descritas em linguagem natural, e a corrija para o formato matemático.
      7.  **Recursos (Imagens):** Se uma questão tiver imagens (nomes de arquivo em \`recursosFileNames\`), insira o seguinte código LaTeX **imediatamente após o enunciado da questão** para cada imagem:
          \\begin{{center}}
              \\includegraphics[width=0.5\\textwidth]{{NOME_DO_ARQUIVO}} % O ARQUIVO DEVE ESTAR NA MESMA PASTA DO TEX (OU CARREGADO NO OVERLEAF)
          \\end{{center}}
      8. **Correção Ortográfica**: Revise o texto do enunciado e das alternativas para corrigir erros ortográficos, gramaticais e de pontuação. **NÃO altere o conteúdo técnico ou pedagógico**.
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

export async function POST_revisar_prova(request: NextRequest) {
  try {
    console.log("Recebida requisição para revisar prova com Gemini...");
    const body = await request.json();
    const provaJson = body.prova; // Espera receber o JSON da prova no corpo da requisição

    if (!provaJson || !provaJson.questoes || provaJson.questoes.length === 0) {
      console.error("JSON da prova inválido ou vazio recebido.");
      return NextResponse.json(
        { success: false, message: 'O JSON da prova é inválido ou não contém questões.' },
        { status: 400 } 
      );
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.5-flash", 
      temperature: 0.3, 
      maxOutputTokens: 8192,
    });

    // 3. Criar o prompt de revisão
    const reviewTemplate = `
      Você é um revisor e editor pedagógico especialista. Sua tarefa é revisar o JSON de uma prova que será fornecido.
      Para cada questão e suas alternativas, você deve:

      1.  **Corrigir erros ortográficos e gramaticais.** Seja minucioso e corrija qualquer deslize.
      2.  **Melhorar a clareza e a concisão dos enunciados e das alternativas.** Se uma frase for ambígua ou prolixa, reescreva-a para ser mais direta e compreensível, sem alterar o sentido original da pergunta ou da resposta.
      3.  **Manter a estrutura do JSON original.** O objeto JSON de saída deve ter exatamente a mesma estrutura (mesmas chaves, mesmos tipos de dados) do objeto de entrada.
      4.  **NÃO altere o tipo da questão, o gabarito, os recursos (imagens) ou a estrutura dos dados.** Sua função é puramente textual e editorial.

      **[INSTRUÇÕES DE SAÍDA]**
      -   Responda **APENAS** com o objeto JSON revisado.
      -   **NÃO** inclua explicações, saudações ou qualquer texto fora do JSON.
      -   O JSON de saída deve estar formatado corretamente para que possa ser diretamente parseado.

      **[JSON DA PROVA PARA REVISÃO]**
      \`\`\`json
      {prova_json_input}
      \`\`\`

      **[JSON REVISADO]**
    `;

    const prompt = new PromptTemplate({
      template: reviewTemplate,
      inputVariables: ["prova_json_input"],
    });

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const revisedJsonString = await chain.invoke({
      prova_json_input: JSON.stringify(provaJson, null, 2),
    });
    
    console.log("Resposta bruta do modelo:", revisedJsonString);

    const cleanedResponse = revisedJsonString.replace(/^```json\s*|```$/g, '').trim();
    
    let revisedProva;
    try {
        revisedProva = JSON.parse(cleanedResponse);
    } catch (parseError) {
        console.error("Erro ao fazer o parse do JSON retornado pela IA:", parseError);
        console.error("String que falhou no parse:", cleanedResponse);
        throw new Error("A resposta da IA não é um JSON válido.");
    }

    return NextResponse.json({
      success: true,
      message: 'Prova revisada com sucesso!',
      revisedProva: revisedProva,
    });

  } catch (error) {
    console.error("Erro no endpoint de revisão de prova:", error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json(
      { success: false, message: 'Falha ao revisar a prova.', error: errorMessage },
      { status: 500 }
    );
  }
}