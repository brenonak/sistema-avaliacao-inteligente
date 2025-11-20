import { getDb } from "../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../lib/http";
import { ObjectId, Document } from "mongodb";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

function limparQuestaoParaProva(questao: any, pontuacao: number) {
  return {
    _id: questao._id,
    tipo: questao.tipo,
    enunciado: questao.enunciado,
    alternativas: questao.alternativas || [],
    afirmacoes: questao.afirmacoes || [],
    proposicoes: questao.proposicoes || [],
    respostaCorreta: questao.respostaCorreta,
    margemErro: questao.margemErro,
    gabarito: questao.gabarito,
    imagemIds: questao.imagemIds || [],
    tags: questao.tags || [],
    pontuacao: pontuacao,
    // Campos administrativos removidos intencionalmente
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const _id = oid(id);
    if (!_id) return badRequest("id inválido");

    const body = await request.json();
    const { titulo, instrucoes, nomeEscola, disciplina, professor, data, duracao, valorTotal, observacoes, questoesSelecionadas, questoesPontuacao } = body;

    if (!titulo || !instrucoes) {
      return badRequest("Título e instruções são obrigatórios");
    }

    const db = await getDb();

    // Verificar se o curso existe
    const curso = await db.collection("cursos").findOne({ _id });
    if (!curso) return notFound("curso não encontrado");

    // Buscar questões do curso que foram selecionadas
    const questoesIds = (questoesSelecionadas || [])
      .map(oid)
      .filter(Boolean);

    let questoes: Document[] = [];

    if (questoesIds.length > 0) {
      const questoesFromDb = await db.collection("questoes")
        .find({ _id: { $in: questoesIds } })
        .toArray();

      questoes = questoesIds.map(qId => {
        const questao = questoesFromDb.find(q => q._id.equals(qId));
        if (!questao) return null;
        const pontuacao = questoesPontuacao?.[qId.toString()] || 0;
        return limparQuestaoParaProva(questao, pontuacao);
      }).filter(Boolean);
    }

    const prova = {
      cursoId: id,
      titulo,
      instrucoes,
      nomeEscola: nomeEscola || '',
      disciplina: disciplina || '',
      professor: professor || '',
      data: data || '',
      duracao: duracao || '',
      valorTotal: valorTotal || '',
      observacoes: observacoes || '',
      questoes,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };

    const result = await db.collection("provas").insertOne(prova);

    return json({
      id: result.insertedId.toString(),
      message: 'Prova criada com sucesso!',
      ...prova
    });
  } catch (e) {
    console.error("Erro ao criar prova:", e);
    return serverError(e);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const db = await getDb();
    const provas = await db.collection("provas")
      .find({ cursoId: id })
      .sort({ criadoEm: -1 })
      .toArray();

    const provasFormatadas = provas.map(({ _id, ...rest }) => ({
      id: _id?.toString?.() ?? _id,
      ...rest
    }));

    return json({ items: provasFormatadas });
  } catch (e) {
    return serverError(e);
  }
}