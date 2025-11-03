import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { MongoClient, ObjectId } from "mongodb"; // Importa ObjectId
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.local` });

// Helper para validar e converter ID
function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

// O endpoint agora é GET, pois estamos buscando um recurso (a lista gerada)
// A rota deve ser algo como /api/listas/[listaId]/gerar
export async function GET(request: NextRequest, { params }: { params: { listaId: string } }) {
  try {
    const { listaId } = params; // ID da Lista de Exercícios
    console.log(`Recebida requisição para gerar lista: ${listaId}`);

    const _id = oid(listaId);
    if (!_id) {
        return NextResponse.json(
          { success: false, message: 'ID da lista inválido.' },
          { status: 400 }
        );
    }

    const client = new MongoClient(process.env.MONGODB_URI!); 
    let listaJson;
    let listaDefinicao; // Para armazenar os dados da lista (nome, etc.)
    
    try {
      await client.connect();
      const database = client.db(process.env.MONGODB_DB); 
      const questoesCollection = database.collection("questoes");
      const recursosCollection = database.collection("recursos");
      const listasCollection = database.collection("listasDeExercicios");

      // 1. Buscar a definição da lista de exercícios
      listaDefinicao = await listasCollection.findOne({ _id });
      
      if (!listaDefinicao) {
        return NextResponse.json(
          { success: false, message: 'Lista de exercícios não encontrada.' },
          { status: 404 }
        );
      }

      // 2. Buscar as questões com base nos IDs salvos na lista
      const questoesObjectIds = listaDefinicao.questoesIds.map((id: string) => oid(id)).filter(Boolean);

      const questoesDaListaDb = await questoesCollection
        .find({ _id: { $in: questoesObjectIds } })
        .toArray();

      // Mapeia para garantir a ordem original (se necessário)
      const questoesMap = new Map(questoesDaListaDb.map(q => [q._id.toString(), q]));
      const questoesDaLista = listaDefinicao.questoesIds
          .map((id: string) => questoesMap.get(id))
          .filter(Boolean); // Filtra caso algum ID não seja encontrado

      if (questoesDaLista.length === 0) {
        throw new Error("Nenhuma questão foi encontrada para esta lista.");
      }

      // 3. Buscar URLs dos recursos (imagens) para cada questão (Lógica melhorada)
      const questoesComRecursos = await Promise.all(
        questoesDaLista.map(async (questao) => {
          if (!questao.recursos || questao.recursos.length === 0) {
            return questao;
          }

          try {
            // Converte os IDs de recurso (strings) para ObjectIds
            const recursoObjectIds = questao.recursos
              .map((id: string) => oid(id))
              .filter(Boolean); // Filtra IDs inválidos

            if (recursoObjectIds.length === 0) return questao;

            const recursos = await recursosCollection
              .find({ _id: { $in: recursoObjectIds } })
              .toArray();

            const recursosFileNames = recursos.map(r => r.file_name || r.filename || 'imagem.jpg');

            return {
              ...questao,
              recursosFileNames
            };
          } catch (err) {
            console.error(`Erro ao buscar recursos da questão ${questao._id}:`, err);
            return questao;
          }
        })
      );

      // 4. Montar o JSON para o Gemini
      listaJson = {
        titulo: `Lista de Exercícios: ${listaDefinicao.nomeMateria}`,
        instituicao: listaDefinicao.nomeInstituicao || '', // Pega a instituição da lista
        questoes: questoesComRecursos,
      };
      
      console.log(`Total de questões: ${questoesComRecursos.length}`);
      
    } finally {
      await client.close();
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.5-flash", 
      temperature: 0.2,
      maxOutputTokens: 8192,
    });

    // --- TEMPLATE LaTeX SIMPLIFICADO PARA LISTA ---

    // Esqueleto do LaTeX (Início) - SIMPLIFICADO PARA LISTA
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
    \\newcounter{somatorioitem}
    \\setcounter{somatorioitem}{0}
    \\newcommand{\\somatorioitemlabel}{
        \\stepcounter{somatorioitem}
        \\pgfmathsetmacro{\\poweroftwo}{2^(\\value{somatorioitem}-1)}
        ( \\pgfmathprintnumber[int detect]{\\poweroftwo} )
    }
    \\newenvironment{somatoriochoices}{
        \\list{\\somatorioitemlabel}{
            \\setlength{\\labelwidth}{4em}
            \\setlength{\\leftmargin}{\\labelwidth}
            \\addtolength{\\leftmargin}{\\labelsep}
            \\setlength{\\itemsep}{0.5ex}
            \\setlength{\\parsep}{0.3ex}
            \\setlength{\\topsep}{0.3ex}
            \\renewcommand{\\makelabel}[1]{\\hss##1}
        }
        \\setcounter{somatorioitem}{0}
    }{
        \\endlist
    }

    \\begin{document}

    % TÍTULO DA LISTA (Puxado do DB)
    \\begin{center}
    ${listaJson.instituicao ? `\\large ${listaJson.instituicao} \\\\ \n \\vspace{0.2cm}` : ''}
    \\Large\\bfseries ${listaJson.titulo} \\\\
    \\end{center}
    \\vspace{1cm}
    
    % Removemos o cabeçalho de "Aluno" e "Matrícula"

    % ÁREA DE QUESTÕES
    \\begin{questions}
    `;

    // Esqueleto do LaTeX (Fim) - Idêntico
    const latexSkeletonEnd = `
    \\end{questions}
    \\end{document}
    `;

    // --- FIM DO TEMPLATE ---

    const latexTemplate = `
    Você é um assistante especialista em LaTeX. Sua **única tarefa** é ler o objeto JSON fornecido e gerar **SOMENTE** o código LaTeX para as questões, usando o ambiente 'exam', sem **NENHUM** texto adicional ou explicação.

    **NÃO INCLUA** \`\\documentclass\`, \`\\begin{{document}}\`, \`\\begin{{questions}}\`, \`\\end{{questions}}\` ou \`\\end{{document}}\` no seu resultado e não importe nenhum \`\\package{{}}\` ou afins.

      **[INSTRUÇÕES DE CONVERSÃO RIGOROSAS]**
      1.  **Formato de Saída:** O retorno deve ser **100% código LaTeX**. Não inclua NENHUMA saudação, explicação, introdução ou texto fora do código.
      2.  **SEM MARCAÇÃO:** NÃO use blocos de código Markdown (\`\`\`) no seu resultado.
      3.  **ESCOPO:** NÃO inclua \`\\documentclass\`, \`\\begin{{document}}\`, \`\\begin{{questions}}\` ou \`\\end{{document}}\`. Não importe \`\\package{{}}\`. Faça apenas a inserção das questões.
      4.  **Estrutura de Questão:** Use o comando \`\\question\` para iniciar cada questão.
      5.  **Regras de Formatação por Tipo:**
          * **Tipo 'alternativa'**: Use o ambiente **\`\\begin{{choices}}\` e \`\\end{{choices}}\`**. Cada opção deve ser \`\\choice <texto da alternativa>\`.
          * **Tipo 'vf' (Verdadeiro/Falso)**: Use o ambiente **\`\\begin{{choices}}\` e \`\\end{{choices}}\`**. Cada opção deve ser \`\\item[($\\quad$)] <texto da alternativa>\`.
          * **Tipo 'discursiva'**: Após o enunciado da questão, adicione **\`\\fillwithlines{{5cm}}\`** para o espaço de resposta.
          * **Tipo 'proposicoes'**: Use o ambiente **\`\\begin{{somatoriochoices}}\` e \`\\end{{somatoriochoices}}\`**. Cada opção deve ser \`\\item <texto da alternativa>\`. Na linha abaixo de \`\\end{{choices}}\` insira \`\\answerline\`.
          * **Tipo 'numerica'**: Após o enunciado da questão, adicione **\`\\answerline\`** para o espaço de resposta.
      6.  **Notação Matemática:** Se o enunciado ou as alternativas contiverem fórmulas, variáveis ou símbolos matemáticos, use o ambiente matemático (ex: \`$x^2$\` ou \`$\\frac{{1}}{{2}}$\`) sem usar fórmulas centralizadas (SEMPRE fórmulas inline com cifrão simples). Tenha uma atenção especial para frações, que devem usar o comando \`$\\frac{{numerador}}{{denominador}}$\`. Também verifique se há fórmulas descritas em linguagem natural, e a corrija para o formato matemático.
      7.  **Recursos (Imagens):** Se uma questão tiver imagens (nomes de arquivo em \`recursosFileNames\`), insira o seguinte código LaTeX **imediatamente após o enunciado da questão** para cada imagem:
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
      // A variável aqui deve ser 'prova_json' porque o template espera esse nome
      inputVariables: ["prova_json"], 
    });

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const latexQuestions = await chain.invoke({
      // Passamos nosso 'listaJson' para a variável 'prova_json' do template
      prova_json: JSON.stringify(listaJson, null, 2), 
    });

    // Concatena o esqueleto simplificado com as questões geradas
    const fullLatexOutput = `${latexSkeletonStart}${latexQuestions}${latexSkeletonEnd}`;

    const nomeArquivo = `lista_${listaDefinicao.nomeMateria.replace(/\s+/g, '_')}_${Date.now()}.tex`;

    console.log(`Lista gerada: ${nomeArquivo}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Lista de exercícios gerada com sucesso!',
      fileName: nomeArquivo,
      latexContent: fullLatexOutput
    });

  } catch (error) {
    console.error("Erro ao gerar lista com Gemini:", error);
    return NextResponse.json(
      { success: false, message: 'Falha ao gerar a lista.' },
      { status: 500 }
    );
  }
}