import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.local` });

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; provaId: string }> }
) {
  try {
    console.log("Recebida requisição para gerar prova com Gemini...");

    const { id: cursoId, provaId } = await params;

    if (!cursoId || !provaId) {
      return NextResponse.json({ success: false, message: "cursoId e provaId são obrigatórios" }, { status: 400 });
    }

    const cursoOid = oid(cursoId);
    const provaOid = oid(provaId);

    if (!cursoOid || !provaOid) {
      return NextResponse.json({ success: false, message: "IDs inválidos" }, { status: 400 });
    }

    const db = await getDb();

    const prova: any = await db.collection("provas").findOne({
      _id: provaOid,
      cursoId: cursoId
    });

    if (!prova) {
      return NextResponse.json({ success: false, message: "Prova não encontrada neste curso" }, { status: 404 });
    }

    if (prova.data && typeof prova.data === 'string') {
      try { //Conversão do campo data de "YYYY-MM-DD" para "DD/MM/YYYY"
        const partes = prova.data.split('-');
        if (partes.length === 3) {
          prova.data = `${partes[2]}/${partes[1]}/${partes[0]}`; // Ex: "04/11/2025"
        }
      } catch (e) {
        console.error("Erro ao formatar data:", e);
      }
    }

    const questoesLimpas = await Promise.all(
      (prova.questoes || []).map(async (questao: any) => {

        let filenames: string[] = [];

        const rawImagemIds = questao.imagemIds || [];

        if (Array.isArray(rawImagemIds) && rawImagemIds.length > 0) {
          // Normaliza os IDs para ObjectId, suportando strings e formato Extended JSON { $oid: ... }
          const imagemObjectIds = rawImagemIds.map((item: any) => {
            if (typeof item === 'string') return oid(item);
            if (item instanceof ObjectId) return item;
            if (item && item.$oid) return oid(item.$oid)
            return null;
          }).filter((id): id is ObjectId => id !== null);

          if (imagemObjectIds.length > 0) {
            // Busca na coleção 'recursos' usando os IDs encontrados em 'imagemIds'
            const recursosDocs = await db.collection("recursos")
              .find({ _id: { $in: imagemObjectIds } })
              .project({ filename: 1 })
              .toArray();

            filenames = recursosDocs
              .map(r => r.filename)
              .filter(f => f && typeof f === 'string');
          }
        }

        // JSON limpo
        return {
          tipo: questao.tipo,
          enunciado: questao.enunciado,
          pontuacao: questao.pontuacao,
          alternativas: questao.alternativas,
          afirmacoes: questao.afirmacoes,
          proposicoes: questao.proposicoes,
          // Envia explicitamente o array de nomes de arquivo
          // TODO: Futuramente, caso implementada a feature de compilação do .tex na plataforma, enviar URLs completas.
          recursoFilenames: filenames
        };
      })
    );

    const provaJsonParaLLM = {
      titulo: prova.titulo,
      instrucoes: prova.instrucoes,
      nomeEscola: prova.nomeEscola,
      disciplina: prova.disciplina,
      professor: prova.professor,
      data: prova.data,
      questoes: questoesLimpas,
    };

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.5-flash",
      temperature: 0.2,
      maxOutputTokens: 8192,
    });

    // Esqueleto do LaTeX (Início)
    const latexSkeletonStart = `\\documentclass[12pt, a4paper, addpoints]{exam}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{a4paper, left=20mm, right=20mm, top=30mm, bottom=20mm}
\\usepackage{amsmath, amssymb}
\\usepackage{xcolor}
\\usepackage{tikz}
\\usepackage{graphicx}
\\usepackage{adjustbox}
\\pagestyle{empty}

% ADAPTAÇÃO DE COMANDOS
\\renewcommand{\\thechoice}{\\Alph{choice}}
\\renewcommand{\\choicelabel}{\\thechoice)}
\\renewcommand{\\points}[1]{\\textbf{(#1 pontos)}}

% AMBIENTE PARA QUESTÃO SOMATÓRIO
\\newcounter{somatorioitem}
\\setcounter{somatorioitem}{0}

\\newcommand{\\somatorioitemlabel}{
    \\stepcounter{somatorioitem}%
    \\pgfmathsetmacro{\\poweroftwo}{2^(\\value{somatorioitem}-1)}%
    ( \\pgfmathprintnumber[int detect]{\\poweroftwo} )
}

\\newenvironment{somatoriochoices}{
    \\list{\\somatorioitemlabel}{%
        \\setlength{\\labelwidth}{4em}%
        \\setlength{\\leftmargin}{\\labelwidth}%
        \\addtolength{\\leftmargin}{\\labelsep}%
        \\setlength{\\itemsep}{0.5ex}%
        \\setlength{\\parsep}{0.3ex}%
        \\setlength{\\topsep}{0.3ex}%
        \\renewcommand{\\makelabel}[1]{\\hss##1}
    }
    \\setcounter{somatorioitem}{0}%
}{
    \\endlist
}

\\begin{document}

\\vspace*{-2cm}
\\begin{table}[h!]
    \\centering
    \\fontsize{0.38cm}{0.5cm}\\selectfont
    \\begin{tabular}{|p{11cm}|p{4cm}|}
        \\hline
        \\multicolumn{2}{|l|}{\\textbf{${prova.nomeEscola || 'Nome da Instituição'} }} \\\\ \\cline{1-2}
        \\multicolumn{2}{|l|}{\\textbf{Disciplina:} ${prova.disciplina || 'Nome da Disciplina'} } \\\\ \\cline{1-2}
        \\multicolumn{2}{|l|}{\\textbf{Professor(a):} ${prova.professor || 'Nome do Professor'} } \\\\ \\cline{1-2}
        \\multicolumn{2}{|l|}{\\textbf{Data:} ${prova.data || 'Data da Prova'} } \\\\ \\cline{1-2}
        \\textbf{Discente:} & \\textbf{Matrícula:}\\\\ 
        \\cline{1-2}
    \\end{tabular}
\\end{table}

\\begin{center}
    {\\bfseries ${prova.titulo} }
\\end{center}

\\begin{center}
\\fbox{%
    \\parbox{15cm}{%
        \\textbf{\\textcolor{red}{Instruções:}}\\\\
        \\itshape ${prova.instrucoes}
    }%
}
\\end{center}

\\vspace{0.5cm}

\\begin{questions}
`;

    // Esqueleto do LaTeX (Fim)
    const latexSkeletonEnd = `
\\end{questions}
\\end{document}
`;

    const latexTemplate = `Você é um assistente especialista em LaTeX. Sua **única tarefa** é ler o objeto JSON fornecido e gerar **SOMENTE** o código LaTeX para as questões, usando o ambiente 'exam', sem **NENHUM** texto adicional ou explicação.

**NÃO INCLUA** \\documentclass, \\begin{{document}}, \\begin{{questions}}, \\end{{questions}} ou \\end{{document}} no seu resultado e não importe nenhum \\package{{}} ou afins.

**[INSTRUÇÕES DE CONVERSÃO RIGOROSAS]**
1. **Formato de Saída:** O retorno deve ser **100% código LaTeX**. Não inclua NENHUMA saudação, explicação, introdução ou texto fora do código.
2. **SEM MARCAÇÃO:** NÃO use blocos de código Markdown no seu resultado.
3. **ESCOPO:** NÃO inclua \\documentclass, \\begin{{document}}, \\begin{{questions}} ou \\end{{document}}. Não importe \\package{{}}. Faça apenas a inserção das questões.
4. **Estrutura de Questão:**
   * Comece cada questão com \\question.
   * Siga com o enunciado da questão.
   * **Pontuação:** Se o campo pontuacao for maior que zero, adicione o comando \\points{{...}} **IMEDIATAMENTE APÓS** o TEXTO do enunciado.  
   * O valor da pontuação deve usar VÍRGULA como separador decimal. Ex: "pontuacao": 1.5 deve virar \\points{{1,5}}. "pontuacao": 2 deve virar \\points{{2}}.
   * **Exemplo Correto:** \\question Este é o enunciado \\points{{1,5}}
5. **Regras de Formatação por Tipo:**
   * **Tipo 'alternativa'**: Use o ambiente **\\begin{{choices}} e \\end{{choices}}**. Cada opção deve ser \\choice <texto da alternativa>.
   * **Tipo 'afirmacoes'**: Use o ambiente **\\begin{{choices}} e \\end{{choices}}**. Cada opção deve ser \\item[($\\quad$)] <texto da alternativa>.
   * **Tipo 'dissertativa'**: Após o enunciado da questão, adicione **\\fillwithlines{{5cm}}** para o espaço de resposta.
   * **Tipo 'proposicoes'**: Use o ambiente **\\begin{{somatoriochoices}} e \\end{{somatoriochoices}}**. Cada opção deve ser \\item <texto da alternativa>. Na linha abaixo de \\end{{somatoriochoices}} insira \\answerline.
   * **Tipo 'numerica'**: Após o enunciado da questão, adicione **\\answerline** para o espaço de resposta.
6. **Notação Matemática:** Se o enunciado ou as alternativas contiverem fórmulas, variáveis ou símbolos matemáticos, use o ambiente matemático (ex: $x^2$ ou $\\frac{{1}}{{2}}$) sem usar fórmulas centralizadas (SEMPRE fórmulas inline com cifrão simples). Tenha uma atenção especial para frações, que devem usar o comando $\\frac{{numerador}}{{denominador}}$. Também verifique se há fórmulas descritas em linguagem natural, e a corrija para o formato matemático.
7. **Recursos (Imagens):**
    * Verifique o campo \`recursoFilenames\` no JSON. Ele é uma lista de strings.
    * Se essa lista contiver nomes de arquivos (ex: "imagem.png"), gere o seguinte código LaTeX IMEDIATAMENTE APÓS o enunciado:
    \\begin{{center}}
        \\includegraphics[width=0.5\\textwidth]{{NOME_EXATO_DO_ARQUIVO}}
    \\end{{center}}
    * **NUNCA** invente nomes de arquivos. Use APENAS o que está em \`recursoFilenames\`.
    * Se \`recursoFilenames\` estiver vazio, NÃO gere o comando \\includegraphics.
8. **Correção Ortográfica**: Revise o texto do enunciado e das alternativas para corrigir erros ortográficos, gramaticais e de pontuação. **NÃO altere o conteúdo técnico ou pedagógico**.

**[JSON DA PROVA PARA CONVERSÃO]**
{prova_json}

CÓDIGO LATEX GERADO (APENAS QUESTÕES):`;

    const prompt = new PromptTemplate({
      template: latexTemplate,
      inputVariables: ["prova_json"],
    });

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const latexQuestions = await chain.invoke({
      prova_json: JSON.stringify(provaJsonParaLLM, null, 2),
    });

    // Concatenar e retornar
    const fullLatexOutput = `${latexSkeletonStart}${latexQuestions}${latexSkeletonEnd}`;

    const nomeArquivo = `prova_${prova.titulo.replace(/[^a-z0-9]/gi, '_') || provaId}.tex`;

    console.log(`Prova gerada: ${nomeArquivo}`);
    return NextResponse.json({
      success: true,
      message: 'Prova gerada com sucesso!',
      fileName: nomeArquivo,
      latexContent: fullLatexOutput
    });

  } catch (error) {
    console.error("Erro ao gerar prova:", error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar a prova.';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}