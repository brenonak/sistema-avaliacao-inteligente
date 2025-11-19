import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId, Document } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.local` });

function oid(id: string) {
    try { return new ObjectId(id); } catch { return null; }
}

/**
 * Gera um bloco de texto LaTeX para o gabarito com base no JSON completo da lista.
 */
function generateGabaritoLatex(lista: any): string {
    // \newpage só é adicionado se houver questões
    if (!lista.questoes || lista.questoes.length === 0) {
        return "";
    }

    let gabaritoString = "\n\\newpage\n\\section*{Gabarito}\n\\begin{enumerate}[1.]\n";

    lista.questoes.forEach((q: any) => {
        gabaritoString += `  \\item `;
        switch (q.tipo) {
            case 'alternativa':
                const correta = q.alternativas?.find((a: any) => a.correta);
                // O 'letra' é 'A', 'B', 'C' etc. que vem do JSON
                gabaritoString += correta ? `Letra ${correta.letra}: ${correta.texto}` : 'Sem resposta';
                break;
            case 'afirmacoes':
                const seq = q.afirmacoes?.map((a: any) => a.correta ? 'V' : 'F').join(', ');
                gabaritoString += seq ? `Sequência: ${seq}` : 'Sem resposta';
                break;
            case 'proposicoes':
                const soma = q.proposicoes?.reduce((acc: number, p: any) => acc + (p.correta ? Number(p.valor) : 0), 0);
                gabaritoString += `Soma: ${soma}`;
                break;
            case 'numerica':
                gabaritoString += `Resposta: ${q.respostaCorreta}`;
                if (q.margemErro > 0) gabaritoString += ` (± ${q.margemErro})`;
                break;
            case 'dissertativa':
                gabaritoString += q.gabarito || 'Resposta não fornecida.';
                break;
            default:
                gabaritoString += 'Tipo de questão sem gabarito definido.';
        }
        gabaritoString += "\n";
    });

    gabaritoString += "\\end{enumerate}\n";
    return gabaritoString;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, listaId: string }> }
) {
    try {
        const { searchParams } = new URL(request.url);
        const includeGabarito = searchParams.get('includeGabarito') === 'true';

        const resolvedParams = await params;
        console.log(`Recebida requisição para gerar lista: ${resolvedParams.listaId} (Gabarito: ${includeGabarito})`);

        const { id: cursoId, listaId } = resolvedParams;
        const _id = oid(listaId);

        if (!_id) {
            return NextResponse.json({ success: false, message: 'ID da lista inválido.' }, { status: 400 });
        }

        const db = await getDb();
        let listaJson;
        let listaDefinicao;

        listaDefinicao = await db.collection("listasDeExercicios").findOne({ _id });

        if (!listaDefinicao) {
            return NextResponse.json({ success: false, message: 'Lista de exercícios não encontrada.' }, { status: 404 });
        }

        const questoesObjectIds = listaDefinicao.questoesIds.map((id: string) => oid(id)).filter(Boolean);

        const questoesDaListaDb = await db.collection("questoes")
            .find({ _id: { $in: questoesObjectIds } })
            .toArray();

        const questoesMap = new Map(questoesDaListaDb.map(q => [q._id.toString(), q]));
        const questoesDaLista = listaDefinicao.questoesIds
            .map((id: string) => questoesMap.get(id))
            .filter(Boolean);

        if (questoesDaLista.length === 0) {
            throw new Error("Nenhuma questão foi encontrada para esta lista.");
        }

        const questoesComRecursos = await Promise.all(
            questoesDaLista.map(async (questao) => {
                if (!questao.recursos || questao.recursos.length === 0) {
                    return questao;
                }
                const recursoIds = questao.recursos.map(oid).filter(Boolean);
                if (recursoIds.length === 0) return questao;

                const recursosDocs = await db.collection("recursos")
                    .find({ _id: { $in: recursoIds } })
                    .project({ filename: 1 })
                    .toArray();

                const filenames = recursosDocs
                    .map(r => r.filename)
                    .filter(name => typeof name === 'string' && name.trim().length > 0)
                    .map(name => name.trim());

                return {
                    ...questao,
                    recursoFilenames: filenames,
                };
            })
        );

        // Este é o JSON COMPLETO, que será usado para o gabarito
        listaJson = {
            titulo: `Lista de Exercícios: ${listaDefinicao.tituloLista}`,
            instituicao: listaDefinicao.nomeInstituicao || '',
            questoes: questoesComRecursos,
        };

        console.log(`Total de questões: ${questoesComRecursos.length}`);

        const listaLimpa = JSON.parse(JSON.stringify(listaJson));
        for (const questao of listaLimpa.questoes) {
            delete questao.gabarito;
            delete questao.respostaCorreta;
            delete questao.margemErro;
            if (questao.alternativas) {
                for (const alt of questao.alternativas) {
                    delete alt.correta;
                }
            }
            if (questao.afirmacoes) {
                for (const af of questao.afirmacoes) {
                    delete af.correta;
                }
            }
            if (questao.proposicoes) {
                for (const p of questao.proposicoes) {
                    delete p.correta;
                }
            }
        }
        const jsonParaLLM = listaLimpa;


        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash",
            temperature: 0.2,
            maxOutputTokens: 8192,
        });

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
\\usepackage{grffile}
\\usepackage{enumerate}
\\pagestyle{empty}

% REGRAS DE FORMATAÇÃO DE ESCOLHAS (FIXAS)
\\renewcommand{\\thechoice}{\\Alph{choice}}
\\renewcommand{\\choicelabel}{\\thechoice)}

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

\\begin{center}
${listaJson.instituicao ? `\\large ${listaJson.instituicao} \\\\ \n \\vspace{0.2cm}` : ''}
\\Large\\bfseries ${listaJson.titulo} \\\\
\\end{center}
\\vspace{1cm}

\\begin{questions}
    `;

        const latexSkeletonEnd = `
\\end{questions}
    `;


        // --- 4. ATUALIZAR O PROMPT ---
        const latexTemplate = `
    Você é um assistente especialista em LaTeX. Sua **única tarefa** é ler o objeto JSON fornecido e gerar **SOMENTE** o código LaTeX para as questões, usando o ambiente 'exam', sem **NENHUM** texto adicional ou explicação.

    **NÃO INCLUA** \`\\documentclass\`, \`\\begin{{document}}\`, \`\\begin{{questions}}\`, \`\\end{{questions}}\` ou \`\\end{{document}}\` no seu resultado e não importe nenhum \`\\package{{}}\` ou afins.

    **[INSTRUÇÕES DE CONVERSÃO RIGOROSAS]**
        1. **Formato de Saída:** O retorno deve ser **100% código LaTeX**. Não inclua NENHUMA saudação, explicação, introdução ou texto fora do código.
        2. **SEM MARCAÇÃO:** NÃO use blocos de código Markdown (\`\`\`) no seu resultado.
        3. **ESCOPO:** NÃO inclua \`\\documentclass\`, \`\\begin{{document}}\`, \`\\begin{{questions}}\` ou \`\\end{{document}}\`. Não importe \`\\package{{}}\`. Faça apenas a inserção das questões.
        4. **Estrutura de Questão:** Use o comando \`\\question\` para iniciar cada questão.
        5. **Regras de Formatação por Tipo:**
          * **Tipo 'alternativa'**: Use o ambiente **\`\\begin{{choices}}\` e \`\\end{{choices}}\`**. Cada opção deve ser \`\\choice <texto da alternativa>\`.
          * **Tipo 'vf' (Verdadeiro/Falso)**: Use o ambiente **\`\\begin{{choices}}\` e \`\\end{{choices}}\`**. Cada opção deve ser \`\\item[($\\quad$)] <texto da alternativa>\`.
          * **Tipo 'discursiva'**: Após o enunciado da questão, adicione **\`\\fillwithlines{{5cm}}\`** para o espaço de resposta.
          * **Tipo 'proposicoes'**: Use o ambiente **\`\\begin{{somatoriochoices}}\` e \`\\end{{somatoriochoices}}\`**. Cada opção deve ser \`\\item <texto da alternativa>\`. Na linha abaixo de \`\\end{{choices}}\` insira \`\\answerline\`.
          * **Tipo 'numerica'**: Após o enunciado da questão, adicione **\`\\answerline\`** para o espaço de resposta.
        6. **Notação Matemática:** Se o enunciado ou as alternativas contiverem fórmulas, variáveis ou símbolos matemáticos, use o ambiente matemático (ex: \`$x^2$\` ou \`$\\frac{{1}}{{2}}$\`) sem usar fórmulas centralizadas (SEMPRE fórmulas inline com cifrão simples). Tenha uma atenção especial para frações, que devem usar o comando \`$\\frac{{numerador}}{{denominador}}$\`. Também verifique se há fórmulas descritas em linguagem natural, e a corrija para o formato matemático.
        7. **Recursos (Imagens):** Se uma questão tiver imagens (nomes de arquivo em \`recursosFileNames\`), insira o seguinte código LaTeX **imediatamente após o enunciado da questão** para cada imagem:
        \\begin{{center}}
            \\includegraphics[width=0.5\\textwidth]{{NOME_DO_ARQUIVO}}
        \\end{{center}}
        8. **Correção Ortográfica**: Revise o texto do enunciado e das alternativas para corrigir erros ortográficos, gramaticais e de pontuação. **NÃO altere o conteúdo técnico ou pedagógico**.
        **[JSON DA PROVA PARA CONVERSÃO]**
        \`\`\`json
        {json_data}
        \`\`\`

        CÓDIGO LATEX GERADO (APENAS QUESTÕES):
        `;

        const prompt = new PromptTemplate({
            template: latexTemplate,
            inputVariables: ["json_data"],
        });

        const chain = prompt.pipe(model).pipe(new StringOutputParser());

        const latexQuestions = await chain.invoke({
            json_data: JSON.stringify(jsonParaLLM, null, 2), // Envia o JSON "limpo"
        });

        // Gerar o bloco de gabarito manualmente (rápido e confiável)
        // SÓ se o switch foi marcado
        let gabaritoBlock = "";
        if (includeGabarito) {
            gabaritoBlock = generateGabaritoLatex(listaJson); // Usa o JSON *completo*
        }

        // Concatenar tudo na ordem correta
        const fullLatexOutput = `${latexSkeletonStart}${latexQuestions}${latexSkeletonEnd}${gabaritoBlock}\n\\end{document}`;

        const nomeArquivo = `lista_${listaDefinicao.tituloLista.replace(/\s+/g, '_')}_${Date.now()}.tex`;

        console.log(`Lista gerada: ${nomeArquivo}`);
        return NextResponse.json({
            success: true,
            message: 'Lista de exercícios gerada com sucesso!',
            fileName: nomeArquivo,
            latexContent: fullLatexOutput
        });

    } catch (error) {
        console.error("Erro ao gerar lista com Gemini:", error);
        const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar a lista.';
        return NextResponse.json(
            { success: false, message: errorMessage },
            { status: 500 }
        );
    }
}