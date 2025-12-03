import { NextResponse } from "next/server";
import { getUserIdOrUnauthorized } from "../../../../../../../lib/auth-helpers";
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import * as SubmissoesService from "../../../../../../../services/db/submissoes.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; provaId: string }> }
) {
  try {
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const { provaId } = await params;
    const db = await getDb();

    // 1. Buscar a Prova
    const prova = await db.collection("provas").findOne({ _id: new ObjectId(provaId) });
    if (!prova) {
      return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
    }

    // 2. Buscar a Submissão
    const submissao = await SubmissoesService.getSubmissao(userId, provaId);

    if (!submissao) {
      return NextResponse.json({ error: "Submissão não encontrada" }, { status: 404 });
    }

    // 3. Montar o objeto de resposta
    const questoesMap = new Map();
    if (Array.isArray(prova.questoes)) {
      prova.questoes.forEach((q: any) => {
        questoesMap.set(q._id?.toString() || q.id, q);
      });
    }

    const questoesResultado = submissao.respostas.map((resp) => {
      const qId = resp.questaoId.toString();
      const questaoOriginal = questoesMap.get(qId) || {};

      return {
        id: qId,
        numero: questaoOriginal.numero || 0, // Se tiver número na questão
        enunciado: questaoOriginal.enunciado || "",
        tipo: questaoOriginal.tipo,
        valor: resp.pontuacaoMaxima,
        notaObtida: resp.pontuacaoObtida,
        respostaAluno: resp.resposta,
        respostaCorreta: questaoOriginal.respostaCorreta || questaoOriginal.gabarito, // Ajustar conforme estrutura
        feedback: resp.feedback, // Feedback do professor
        alternativas: questaoOriginal.alternativas,
        afirmacoes: questaoOriginal.afirmacoes,
        proposicoes: questaoOriginal.proposicoes,
      };
    });

    // Ordenar questões se necessário (ex: pela ordem original na prova)
    // Aqui assumimos que a ordem na submissão pode não ser a mesma, então seria bom reordenar baseada na prova
    const questoesOrdenadas = [];
    if (Array.isArray(prova.questoes)) {
        for(const q of prova.questoes) {
            const qId = q._id?.toString() || q.id;
            const resp = questoesResultado.find(r => r.id === qId);
            if (resp) {
                questoesOrdenadas.push({
                    ...resp,
                    numero: questoesOrdenadas.length + 1 // Renumera sequencialmente
                });
            }
        }
    }

    const resultado = {
      prova: {
        titulo: prova.titulo,
        data: prova.data,
        valorTotal: prova.valorTotal || 0,
        professor: prova.professor,
        instrucoes: prova.instrucoes,
      },
      desempenho: {
        nota: submissao.notaTotal,
        aprovado: true, // Lógica de aprovação se houver
        dataEntrega: submissao.dataFim || submissao.updatedAt,
      },
      questoes: questoesOrdenadas.length > 0 ? questoesOrdenadas : questoesResultado,
    };

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar resultado:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
