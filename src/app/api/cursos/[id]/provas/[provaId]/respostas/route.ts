import { json, badRequest, serverError } from "../../../../../../../lib/http";
import { getUserIdOrUnauthorized } from "../../../../../../../lib/auth-helpers";
import { NextResponse } from "next/server";
import * as SubmissoesService from "../../../../../../../services/db/submissoes.service";
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { calcularCorrecao, QuestaoDoc } from "../../../../../../../lib/correction";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string, provaId: string }> }
) {
    try {
        const userIdOrError = await getUserIdOrUnauthorized();
        if (userIdOrError instanceof NextResponse) return userIdOrError;
        const userId = userIdOrError;

        const { provaId } = await params;

        // Buscar a submissão do aluno para esta prova
        const submissao = await SubmissoesService.getSubmissao(userId, provaId);

        const respostasMap: Record<string, any> = {};
        const correcaoMap: Record<string, { isCorrect: boolean; pontuacaoObtida: number | null; pontuacaoMaxima: number; feedback?: string }> = {};
        let finalizado = false;
        let dataFinalizacao: Date | null = null;
        let pontuacaoTotal = 0;
        let pontuacaoObtidaTotal = 0;

        if (submissao) {
            finalizado = submissao.status === "FINALIZADO";
            dataFinalizacao = submissao.dataFim || null;
            pontuacaoObtidaTotal = submissao.notaTotal;

            submissao.respostas.forEach(r => {
                const questaoIdStr = r.questaoId.toString();
                respostasMap[questaoIdStr] = r.resposta;

                correcaoMap[questaoIdStr] = {
                    isCorrect: r.isCorrect,
                    pontuacaoObtida: r.pontuacaoObtida,
                    pontuacaoMaxima: r.pontuacaoMaxima,
                    feedback: r.feedback
                };

                pontuacaoTotal += r.pontuacaoMaxima || 0;
            });
        }

        return json({
            ok: true,
            respostas: respostasMap,
            correcao: correcaoMap,
            finalizado,
            dataFinalizacao,
            pontuacaoTotal,
            pontuacaoObtidaTotal,
        });
    } catch (e) {
        console.error("Erro ao buscar respostas (prova):", e);
        return serverError(e);
    }
}

/**
 * POST /api/cursos/:id/provas/:provaId/respostas
 * Salva as respostas do aluno para uma prova
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string, provaId: string }> }
) {
    try {
        const userIdOrError = await getUserIdOrUnauthorized();
        if (userIdOrError instanceof NextResponse) return userIdOrError;
        const userId = userIdOrError;

        const { provaId } = await params;
        const body = await request.json();
        const { respostas, finalizado = false } = body;

        if (!Array.isArray(respostas) || respostas.length === 0) {
            return badRequest("Array de respostas é obrigatório");
        }

        // Verificar se já existe submissão finalizada
        const submissaoExistente = await SubmissoesService.getSubmissao(userId, provaId);
        if (submissaoExistente && submissaoExistente.status === "FINALIZADO") {
            return badRequest("A prova já foi finalizada e não pode ser modificada");
        }

        // Iniciar submissão se não existir
        await SubmissoesService.iniciarSubmissao(userId, provaId, "PROVA");

        const db = await getDb();
        const questoesCollection = db.collection<QuestaoDoc>("questoes");
        const provasCollection = db.collection("provas");

        // Buscar configurações da prova
        const provaDoc = await provasCollection.findOne({ _id: new ObjectId(provaId) });
        // Assumindo que provas também podem ter override de pontuação, se não tiver, usa vazio
        const questoesPontuacao = (provaDoc as any)?.questoesPontuacao || {};

        const respostasSalvas: any[] = [];
        let pontuacaoTotalObtida = 0;
        let pontuacaoTotalMaxima = 0;

        for (const respostaData of respostas) {
            const { questaoId, resposta } = respostaData;

            try {
                // Buscar questão para correção
                const questao = await questoesCollection.findOne({ _id: new ObjectId(questaoId) });

                if (!questao) {
                    console.warn(`Questão ${questaoId} não encontrada`);
                    continue;
                }

                // Determinar pontuação máxima
                const pontuacaoProva = questoesPontuacao[questaoId] ?? questoesPontuacao[questaoId.toString()];
                const pontuacaoMaxima = (typeof pontuacaoProva === 'number')
                    ? pontuacaoProva
                    : (questao.pontuacao ?? 0);

                // Calcular correção
                const questaoParaCorrecao = { ...questao, pontuacao: pontuacaoMaxima };
                const resultado = calcularCorrecao(questaoParaCorrecao, resposta);

                // Registrar na submissão
                const respostaSubmissao: SubmissoesService.RespostaSubmissao = {
                    questaoId: new ObjectId(questaoId),
                    resposta: resposta,
                    pontuacaoObtida: resultado.pontuacaoObtida,
                    pontuacaoMaxima: resultado.pontuacaoMaxima,
                    isCorrect: resultado.isCorrect,
                    corrigidoEm: new Date()
                };

                await SubmissoesService.registrarResposta(userId, provaId, "PROVA", respostaSubmissao);

                pontuacaoTotalMaxima += resultado.pontuacaoMaxima;
                pontuacaoTotalObtida += resultado.pontuacaoObtida;

                respostasSalvas.push({
                    questaoId,
                    ...resultado
                });

            } catch (err: any) {
                console.error(`Erro ao processar questão ${questaoId}:`, err);
            }
        }

        // Finalizar se solicitado
        if (finalizado) {
            await SubmissoesService.finalizarSubmissao(userId, provaId);
        }

        return json({
            ok: true,
            message: finalizado ? "Prova finalizada com sucesso!" : "Respostas salvas.",
            respostas: respostasSalvas,
            estatisticas: {
                pontuacaoObtida: pontuacaoTotalObtida,
                pontuacaoMaxima: pontuacaoTotalMaxima,
            }
        });

    } catch (e) {
        console.error("Erro ao salvar respostas (prova):", e);
        return serverError(e);
    }
}
