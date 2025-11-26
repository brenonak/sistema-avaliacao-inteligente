import { NextRequest, NextResponse } from 'next/server';
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserIdOrUnauthorized } from "../../../../../../../lib/auth-helpers";
import { upsertRespostaAluno } from "../../../../../../../services/db/respostaAluno.service";
import { badRequest, serverError } from "../../../../../../../lib/http";

function oid(id: string) {
    try { return new ObjectId(id); } catch { return null; }
}

/**
 * LÓGICA DE CORREÇÃO
 * Compara a resposta do aluno com o gabarito da questão.
 */
function corrigirResposta(
    questao: any,
    resposta: any,
    pontuacaoMaxima: number,
    notaManual?: number
): { pontuacaoObtida: number; isCorrect: boolean } {
    // Normaliza o tipo para evitar erros de caixa alta/baixa
    const tipo = questao.tipo?.toLowerCase();

    // 1. REGRA PRINCIPAL: Se for dissertativa, aceita a nota manual
    if (tipo === 'dissertativa' && notaManual !== undefined) {
        let pontuacaoObtida = Number(notaManual);
        // Garante que não ultrapasse o máximo
        if (pontuacaoObtida > pontuacaoMaxima) pontuacaoObtida = pontuacaoMaxima;
        if (pontuacaoObtida < 0) pontuacaoObtida = 0;

        // Consideramos correto se a nota for maior que 0 (critério simples)
        const isCorrect = pontuacaoObtida > 0;
        return { pontuacaoObtida, isCorrect };
    }

    // 2. LÓGICA DE AUTO-CORREÇÃO (Objetivas)
    switch (tipo) {
        case 'alternativa': {
            const correta = questao.alternativas?.find((a: any) => a.correta);
            // Tenta comparar com a letra OU com o texto (caso o frontend envie o texto)
            const letraCorreta = correta?.letra;
            const textoCorreto = correta?.texto;

            const isCorrect = resposta === letraCorreta || resposta === textoCorreto;
            const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;
            return { pontuacaoObtida, isCorrect };
        }

        case 'afirmacoes': {
            if (!Array.isArray(resposta) || !Array.isArray(questao.afirmacoes)) {
                return { pontuacaoObtida: 0, isCorrect: false };
            }
            let acertos = 0;
            const total = questao.afirmacoes.length;

            // Itera com segurança pelo tamanho menor entre resposta e gabarito
            const len = Math.min(resposta.length, total);

            for (let i = 0; i < len; i++) {
                // Compara booleano com booleano
                if (String(resposta[i]) === String(questao.afirmacoes[i].correta)) acertos++;
            }

            const isCorrect = acertos === total;
            // Cálculo proporcional da nota
            const pontuacaoObtida = total > 0 ? (acertos / total) * pontuacaoMaxima : 0;
            return { pontuacaoObtida, isCorrect };
        }

        case 'proposicoes': {
            const somaCorreta = questao.proposicoes
                ?.filter((p: any) => p.correta)
                .reduce((sum: number, p: any) => sum + (p.valor || 0), 0) || 0;

            const isCorrect = Number(resposta) === somaCorreta;
            const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;
            return { pontuacaoObtida, isCorrect };
        }

        case 'numerica': {
            const respostaCorreta = Number(questao.respostaCorreta);
            // Aqui pegamos a margem de erro da questão (do snapshot da prova)
            const margemErro = Number(questao.margemErro || 0);
            const respostaNum = Number(resposta);

            // Verifica se é número e se está dentro do intervalo [Correta - Margem, Correta + Margem]
            const isCorrect = !isNaN(respostaNum) && Math.abs(respostaNum - respostaCorreta) <= margemErro;
            const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;
            return { pontuacaoObtida, isCorrect };
        }

        default:
            // Se não reconheceu o tipo, retorna 0
            return { pontuacaoObtida: 0, isCorrect: false };
    }
}

// --- FUNÇÃO PRINCIPAL (CONTROLLER) ---

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; provaId: string }> }
) {
    try {
        // 1. Validar Professor (Quem está logado)
        const professorIdOrError = await getUserIdOrUnauthorized();
        if (professorIdOrError instanceof NextResponse) return professorIdOrError;

        const { provaId } = await params;
        const body = await request.json();
        const { alunoId, respostas } = body;

        if (!alunoId || !Array.isArray(respostas) || respostas.length === 0) {
            return NextResponse.json({ success: false, message: "Dados incompletos: alunoId e respostas são obrigatórios." }, { status: 400 });
        }

        const db = await getDb();

        // Validar provaId
        const provaOid = oid(provaId);
        if (!provaOid) return badRequest("ID da prova inválido.");

        // 2. Buscar a prova completa (incluindo o array de questoes SNAPSHOT)
        const prova = await db.collection("provas").findOne({ _id: provaOid });
        if (!prova) return badRequest("Prova não encontrada.");

        // Mapear questões da prova para acesso rápido
        const questoesSnapshotMap = new Map();

        if (Array.isArray(prova.questoes)) {
            prova.questoes.forEach((q: any) => {
                const id = (q._id || q.id)?.toString();
                if (id) questoesSnapshotMap.set(id, q);
            });
        }

        const resultados: any[] = [];

        // 3. Processar, Corrigir e Salvar cada resposta
        for (const respInput of respostas) {

            // Busca estritamente no snapshot da prova
            const questaoParaCorrecao = questoesSnapshotMap.get(respInput.questaoId);

            if (!questaoParaCorrecao) {
                console.warn(`Questão ${respInput.questaoId} enviada na resposta não foi encontrada na prova ${provaId}. Ignorando.`);
                continue;
            }

            // A pontuação máxima vem do objeto da questão dentro da prova
            const pontuacaoMaxima = Number(questaoParaCorrecao.pontuacao) || 0;

            const { pontuacaoObtida, isCorrect } = corrigirResposta(
                questaoParaCorrecao, // Usa os dados congelados na prova (Gabarito Snapshot)
                respInput.resposta,
                pontuacaoMaxima,
                respInput.pontuacaoObtida // Nota manual (para dissertativas)
            );

            // 4. Salvar no nome do Aluno (Upsert)
            const salvo = await upsertRespostaAluno(alunoId, { // alunoId vira o ownerId
                listaId: provaId, // Usa o ID da Prova como ID de contexto (listaId)
                questaoId: respInput.questaoId,
                resposta: respInput.resposta,
                pontuacaoMaxima: pontuacaoMaxima,
                pontuacaoObtida: pontuacaoObtida,
                isCorrect: isCorrect,
                finalizado: true
            });

            resultados.push(salvo);
        }

        return NextResponse.json({
            success: true,
            message: `Correção salva com sucesso! Foram salvas ${resultados.length} respostas para o aluno.`,
            resultados
        });

    } catch (error: any) {
        console.error("Erro ao salvar correção manual:", error);
        return serverError(error);
    }
}