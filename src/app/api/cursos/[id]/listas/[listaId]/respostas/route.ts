import { json, badRequest, serverError } from "../../../../../../../lib/http";
import { getUserIdOrUnauthorized } from "../../../../../../../lib/auth-helpers";
import { NextResponse } from "next/server";
import * as RespostaAlunoService from "../../../../../../../services/db/respostaAluno.service";
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * POST /api/cursos/:id/listas/:listaId/respostas
 * Salva as respostas do aluno para uma lista de exercícios
 * Body: { respostas: Array<{ questaoId, resposta, pontuacaoMaxima }> }
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
    const { respostas } = body;

    if (!Array.isArray(respostas) || respostas.length === 0) {
      return badRequest("Array de respostas é obrigatório");
    }

    const db = await getDb();
    const questoesCollection = db.collection("questoes");
    
    // Buscar todas as questões para corrigir as respostas
    const questoesIds = respostas.map(r => new ObjectId(r.questaoId));
    const questoes = await questoesCollection
      .find({ _id: { $in: questoesIds } })
      .toArray();

    const questoesMap = new Map(questoes.map(q => [q._id.toString(), q]));

    // Processar e salvar cada resposta
    const respostasSalvas: any[] = [];
    
    for (const respostaData of respostas) {
      const { questaoId, resposta, pontuacaoMaxima } = respostaData;
      const questao = questoesMap.get(questaoId);

      if (!questao) {
        console.warn(`Questão ${questaoId} não encontrada`);
        continue;
      }

      // Corrigir a resposta baseada no tipo de questão
      const { pontuacaoObtida, isCorrect } = corrigirResposta(questao, resposta, pontuacaoMaxima);

      // Salvar a resposta no banco
      const respostaSalva = await RespostaAlunoService.createRespostaAluno(userId, {
        questaoId,
        resposta,
        pontuacaoMaxima,
        pontuacaoObtida,
        isCorrect,
      });

      respostasSalvas.push({
        ...respostaSalva,
        _id: respostaSalva._id?.toString(),
        questaoId: respostaSalva.questaoId.toString(),
        ownerId: respostaSalva.ownerId.toString(),
      });
    }

    return json({
      ok: true,
      message: `${respostasSalvas.length} respostas salvas com sucesso!`,
      respostas: respostasSalvas,
    });
  } catch (e) {
    console.error("Erro ao salvar respostas:", e);
    return serverError(e);
  }
}

/**
 * Corrige uma resposta baseada no tipo de questão
 */
function corrigirResposta(
  questao: any, 
  resposta: any, 
  pontuacaoMaxima: number
): { pontuacaoObtida: number; isCorrect: boolean } {
  const tipo = questao.tipo;

  switch (tipo) {
    case 'alternativa': {
      // Múltipla escolha: resposta é uma letra (A, B, C, etc)
      const alternativaCorreta = questao.alternativas?.find((a: any) => a.correta);
      const letraCorreta = alternativaCorreta?.letra;
      
      const isCorrect = resposta === letraCorreta;
      const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;
      
      return { pontuacaoObtida, isCorrect };
    }

    case 'afirmacoes': {
      // V/F: resposta é um array de booleanos
      if (!Array.isArray(resposta) || !Array.isArray(questao.afirmacoes)) {
        return { pontuacaoObtida: 0, isCorrect: false };
      }

      let acertos = 0;
      const total = questao.afirmacoes.length;

      questao.afirmacoes.forEach((afirmacao: any, index: number) => {
        if (resposta[index] === afirmacao.correta) {
          acertos++;
        }
      });

      const isCorrect = acertos === total;
      const pontuacaoObtida = (acertos / total) * pontuacaoMaxima;
      
      return { pontuacaoObtida, isCorrect };
    }

    case 'proposicoes': {
      // Proposições (somatório): resposta é um número
      const somaCorreta = questao.proposicoes
        ?.filter((p: any) => p.correta)
        .reduce((sum: number, p: any) => sum + p.valor, 0) || 0;

      const isCorrect = Number(resposta) === somaCorreta;
      const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;
      
      return { pontuacaoObtida, isCorrect };
    }

    case 'numerica': {
      // Resposta numérica: verifica com margem de erro
      const respostaCorreta = questao.respostaCorreta;
      const margemErro = questao.margemErro || 0;
      const respostaNum = Number(resposta);

      const isCorrect = Math.abs(respostaNum - respostaCorreta) <= margemErro;
      const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;
      
      return { pontuacaoObtida, isCorrect };
    }

    case 'dissertativa': {
      // Dissertativa: não corrige automaticamente
      // Professor deve corrigir manualmente depois
      return { pontuacaoObtida: 0, isCorrect: false };
    }

    default:
      return { pontuacaoObtida: 0, isCorrect: false };
  }
}
