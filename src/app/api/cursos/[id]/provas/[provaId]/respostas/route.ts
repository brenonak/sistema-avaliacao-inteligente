import { json, badRequest, serverError } from "../../../../../../../lib/http";
import { getUserIdOrUnauthorized } from "../../../../../../../lib/auth-helpers";
import { NextResponse } from "next/server";
import * as RespostaAlunoService from "../../../../../../../services/db/respostaAluno.service";
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string, provaId: string }> }
) {
    try {
        const userIdOrError = await getUserIdOrUnauthorized();
        if (userIdOrError instanceof NextResponse) return userIdOrError;
        const userId = userIdOrError;

        const { provaId } = await params;

        // Buscar a prova para obter os IDs das questões (opcional)
        const db = await getDb();
        const provasCol = db.collection("provas");
        const prova = await provasCol.findOne({ _id: new ObjectId(provaId) });

        if (!prova) {
            return badRequest("Prova não encontrada");
        }

        // Buscar respostas do aluno para as questões desta prova
        const respostas = await RespostaAlunoService.listRespostasAluno(userId, provaId);

        const respostasMap: Record<string, any> = {};
        const correcaoMap: Record<string, { isCorrect: boolean; pontuacaoObtida: number | null; pontuacaoMaxima: number; feedback?: string }> = {};
        let finalizado = false;
        let dataFinalizacao: Date | null = null;
        let pontuacaoTotal = 0;
        let pontuacaoObtidaTotal = 0;

        respostas.forEach(r => {
            const questaoIdStr = r.questaoId.toString();
            respostasMap[questaoIdStr] = r.resposta;

            correcaoMap[questaoIdStr] = {
                isCorrect: r.isCorrect,
                pontuacaoObtida: r.pontuacaoObtida,
                pontuacaoMaxima: r.pontuacaoMaxima,
                //feedback: r.feedback || undefined, //TODO: incluir feedback no banco
            };

            pontuacaoTotal += r.pontuacaoMaxima || 0;
            pontuacaoObtidaTotal += r.pontuacaoObtida ?? 0;

            if (r.finalizado) {
                finalizado = true;
                dataFinalizacao = r.dataFinalizacao ?? null;
            }
        });

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
