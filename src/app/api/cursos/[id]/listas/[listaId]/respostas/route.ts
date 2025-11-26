import { json, badRequest, serverError } from "../../../../../../../lib/http";
import { getUserIdOrUnauthorized } from "../../../../../../../lib/auth-helpers";
import { NextResponse } from "next/server";
import * as RespostaAlunoService from "../../../../../../../services/db/respostaAluno.service";
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string, listaId: string }> }
) {
  try {
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const { listaId } = await params;

    // Buscar a lista para obter os IDs das questões
    const db = await getDb();
    const listasCollection = db.collection("listasDeExercicios");
    const lista = await listasCollection.findOne({ _id: new ObjectId(listaId) });

    if (!lista) {
      return badRequest("Lista não encontrada");
    }

    // Buscar respostas do aluno para as questões desta lista
    const questoesIds = (lista.questoesIds || []).map((id: any) =>
      typeof id === 'string' ? id : id.toString()
    );

    // Buscar respostas filtrando por listaId
    const respostas = await RespostaAlunoService.listRespostasAluno(userId, listaId);

    // Transformar em um objeto: { questaoId: resposta }
    const respostasMap: Record<string, any> = {};
    const correcaoMap: Record<string, { isCorrect: boolean; pontuacaoObtida: number | null; pontuacaoMaxima: number }> = {};
    let finalizado = false;
    let dataFinalizacao: Date | null = null;
    let pontuacaoTotal = 0;
    let pontuacaoObtidaTotal = 0;

    respostas.forEach(r => {
      const questaoIdStr = r.questaoId.toString();
      respostasMap[questaoIdStr] = r.resposta;
      
      // Informações de correção
      correcaoMap[questaoIdStr] = {
        isCorrect: r.isCorrect,
        pontuacaoObtida: r.pontuacaoObtida,
        pontuacaoMaxima: r.pontuacaoMaxima,
      };
      
      // Acumular pontuação
      pontuacaoTotal += r.pontuacaoMaxima;
      pontuacaoObtidaTotal += r.pontuacaoObtida ?? 0;
      
      // Se qualquer resposta está finalizada, considera a lista como finalizada
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
    console.error("Erro ao buscar respostas:", e);
    return serverError(e);
  }
}

/**
 * POST /api/cursos/:id/listas/:listaId/respostas
 * Salva as respostas do aluno para uma lista de exercícios com correção automática
 * Body: { respostas: Array<{ questaoId, resposta }>, finalizado?: boolean }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string, listaId: string }> }
) {
  try {
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const { listaId } = await params;
    const body = await request.json();
    const { respostas, finalizado = false } = body;

    if (!Array.isArray(respostas) || respostas.length === 0) {
      return badRequest("Array de respostas é obrigatório");
    }

    // Verificar se as respostas desta lista já foram finalizadas
    const respostasExistentes = await RespostaAlunoService.listRespostasAluno(userId, listaId);
    const respostaFinalizada = respostasExistentes.find(r => r.finalizado === true);

    if (respostaFinalizada) {
      return badRequest("As respostas já foram finalizadas e não podem ser modificadas");
    }

    // Processar e salvar cada resposta usando a função de correção automática
    const respostasSalvas: any[] = [];
    let pontuacaoTotalObtida = 0;
    let pontuacaoTotalMaxima = 0;

    for (const respostaData of respostas) {
      const { questaoId, resposta } = respostaData;

      try {
        // Usar a função submeterRespostaAluno que faz correção automática
        const respostaSalva = await RespostaAlunoService.submeterRespostaAluno(
          userId,
          listaId,
          questaoId,
          resposta
        );

        // Acumular pontuações
        pontuacaoTotalMaxima += respostaSalva.pontuacaoMaxima;
        pontuacaoTotalObtida += respostaSalva.pontuacaoObtida ?? 0;

        respostasSalvas.push({
          ...respostaSalva,
          _id: respostaSalva._id?.toString(),
          questaoId: respostaSalva.questaoId.toString(),
          listaId: respostaSalva.listaId.toString(),
          ownerId: respostaSalva.ownerId.toString(),
        });
      } catch (err: any) {
        console.error(`Erro ao processar questão ${questaoId}:`, err);
        // Continuar com as outras questões
      }
    }

    // Calcular estatísticas
    const totalQuestoes = respostasSalvas.length;
    const questoesCorretas = respostasSalvas.filter(r => r.isCorrect).length;
    const percentualAcerto = totalQuestoes > 0 ? (questoesCorretas / totalQuestoes) * 100 : 0;

    return json({
      ok: true,
      message: finalizado 
        ? `Respostas finalizadas! Você acertou ${questoesCorretas} de ${totalQuestoes} questões.`
        : `${respostasSalvas.length} respostas salvas com sucesso!`,
      respostas: respostasSalvas,
      estatisticas: {
        totalQuestoes,
        questoesCorretas,
        questoesErradas: totalQuestoes - questoesCorretas,
        percentualAcerto: Math.round(percentualAcerto * 100) / 100,
        pontuacaoObtida: pontuacaoTotalObtida,
        pontuacaoMaxima: pontuacaoTotalMaxima,
        percentualPontuacao: pontuacaoTotalMaxima > 0 
          ? Math.round((pontuacaoTotalObtida / pontuacaoTotalMaxima) * 100 * 100) / 100 
          : 0,
      },
    });
  } catch (e) {
    console.error("Erro ao salvar respostas:", e);
    return serverError(e);
  }
}
