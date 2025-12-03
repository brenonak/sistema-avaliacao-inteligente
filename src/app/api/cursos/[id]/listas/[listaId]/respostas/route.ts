import { json, badRequest, serverError } from "../../../../../../../lib/http";
import { getUserIdOrUnauthorized } from "../../../../../../../lib/auth-helpers";
import { NextResponse } from "next/server";
import * as SubmissoesService from "../../../../../../../services/db/submissoes.service";
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { calcularCorrecao, QuestaoDoc } from "../../../../../../../lib/correction";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string, listaId: string }> }
) {
  try {
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const { listaId } = await params;

    // Buscar a submissão do aluno para esta lista
    const submissao = await SubmissoesService.getSubmissao(userId, listaId);

    const respostasMap: Record<string, any> = {};
    const correcaoMap: Record<string, { isCorrect: boolean; pontuacaoObtida: number | null; pontuacaoMaxima: number }> = {};
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
        };
        
        pontuacaoTotal += r.pontuacaoMaxima;
      });
    }

    return json({
      ok: true,
      respostas: respostasMap,
      correcao: correcaoMap,
      finalizado,
      dataFinalizacao,
      pontuacaoTotal, // Nota: Isso é a soma das máximas das questões RESPONDIDAS. Idealmente deveria ser da lista toda.
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

    // Verificar se já existe submissão finalizada
    const submissaoExistente = await SubmissoesService.getSubmissao(userId, listaId);
    if (submissaoExistente && submissaoExistente.status === "FINALIZADO") {
      return badRequest("As respostas já foram finalizadas e não podem ser modificadas");
    }

    // Iniciar submissão se não existir
    await SubmissoesService.iniciarSubmissao(userId, listaId, "LISTA");

    const db = await getDb();
    const questoesCollection = db.collection<QuestaoDoc>("questoes");
    const listasCollection = db.collection("listasDeExercicios");
    
    // Buscar configurações da lista (para pontuação personalizada)
    const listaDoc = await listasCollection.findOne({ _id: new ObjectId(listaId) });
    const questoesPontuacao = listaDoc?.questoesPontuacao || {};

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

        // Determinar pontuação máxima (prioridade para configuração da lista)
        const pontuacaoLista = questoesPontuacao[questaoId] ?? questoesPontuacao[questaoId.toString()];
        const pontuacaoMaxima = (typeof pontuacaoLista === 'number') 
          ? pontuacaoLista 
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

        await SubmissoesService.registrarResposta(userId, listaId, "LISTA", respostaSubmissao);

        // Acumular para retorno
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
      await SubmissoesService.finalizarSubmissao(userId, listaId);
    }

    // Calcular estatísticas para retorno
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
      },
    });
  } catch (e) {
    console.error("Erro ao salvar respostas:", e);
    return serverError(e);
  }
}
