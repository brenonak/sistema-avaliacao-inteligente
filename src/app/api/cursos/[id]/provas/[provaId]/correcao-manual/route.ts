import { NextRequest, NextResponse } from 'next/server';
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId, Document } from "mongodb";
import { getUserIdOrUnauthorized } from "../../../../../../../lib/auth-helpers";
import { upsertRespostaAluno } from "../../../../../../../services/db/respostaAluno.service";
import { badRequest, serverError } from "../../../../../../../lib/http";

function oid(id: string) {
    try { return new ObjectId(id); } catch { return null; }
}

/**
 * LÓGICA DE CORREÇÃO
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

        // Consideramos correto se a nota for maior que 0
        const isCorrect = pontuacaoObtida > 0;
        return { pontuacaoObtida, isCorrect };
    }

    // 2. LÓGICA DE AUTO-CORREÇÃO
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
                if (resposta[i] === questao.afirmacoes[i].correta) acertos++;
            }

            const isCorrect = acertos === total;
            // Cálculo proporcional
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
            const margemErro = Number(questao.margemErro || 0);
            const respostaNum = Number(resposta);

            const isCorrect = !isNaN(respostaNum) && Math.abs(respostaNum - respostaCorreta) <= margemErro;
            const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;
            return { pontuacaoObtida, isCorrect };
        }

        default:
            // Se não reconheceu o tipo, retorna 0
            console.warn(`Tipo de questão desconhecido na correção: ${tipo}`);
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

        // 2. Buscar gabarito e pontuação da prova (para o cache)
        const questoesIds = respostas
            .map((r: any) => oid(r.questaoId))
            .filter((id): id is ObjectId => id !== null);

        const questoesDb = await db.collection("questoes").find({ _id: { $in: questoesIds } }).toArray();
        const prova = await db.collection("provas").findOne({ _id: provaOid });
        if (!prova) return badRequest("Prova não encontrada.");

        // Mapear pontuações da prova (pontuação personalizada de cada questão na prova)
        const pontuacoesNaProva = prova?.questoes?.reduce((acc: any, q: any) => {
            acc[q._id?.toString() || q.id] = q.pontuacao;
            return acc;
        }, {}) || {};

        const resultados: any[] = [];

        // 3. Processar, Corrigir e Salvar cada resposta
        for (const respInput of respostas) {
            const questaoOriginal = questoesDb.find(q => q._id.toString() === respInput.questaoId);
            if (!questaoOriginal) continue;

            // 4. Determinar Pontuação Máxima e Corrigir (Lógica Híbrida)
            const pontuacaoMaxima = pontuacoesNaProva[respInput.questaoId] || questaoOriginal.pontuacao || 0;

            const { pontuacaoObtida, isCorrect } = corrigirResposta(
                questaoOriginal,
                respInput.resposta,
                pontuacaoMaxima,
                respInput.pontuacaoObtida // Nota manual é passada AQUI
            );

            // 5. Salvar no nome do Aluno (Upsert)
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
            message: `Correção salva com sucesso! Foram salvas ${resultados.length} respostas para o aluno ${alunoId}.`,
            resultados
        });

    } catch (error: any) {
        console.error("Erro ao salvar correção manual:", error);
        return serverError(error);
    }
}