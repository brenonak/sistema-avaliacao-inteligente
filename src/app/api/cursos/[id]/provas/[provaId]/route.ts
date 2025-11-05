import { getDb } from "../../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../../lib/http";
import { ObjectId, Document } from "mongodb";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

// GET - Buscar uma prova específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; provaId: string }> }
) {
  try {
    const { id, provaId } = await params;
    const cursoOid = oid(id);
    const provaOid = oid(provaId);

    if (!cursoOid || !provaOid) return badRequest("IDs inválidos");

    const db = await getDb();
    const prova = await db.collection("provas").findOne({
      _id: provaOid,
      cursoId: id,
    });

    if (!prova) return notFound("Prova não encontrada");

    return json({
      ...prova,
      id: prova._id.toString(),
    });
  } catch (error) {
    console.error("Erro ao buscar prova:", error);
    return serverError("Erro ao buscar prova");
  }
}

// PUT - Atualizar uma prova existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; provaId: string }> }
) {
  try {
    const { id, provaId } = await params;
    const cursoOid = oid(id);
    const provaOid = oid(provaId);

    if (!cursoOid || !provaOid) return badRequest("IDs inválidos");

    const body = await request.json();
    const {
      titulo,
      instrucoes,
      nomeEscola,
      disciplina,
      professor,
      data,
      duracao,
      valorTotal,
      observacoes,
      questoesSelecionadas,
      questoesPontuacao,
    } = body;

    if (!titulo || !instrucoes) {
      return badRequest("Título e instruções são obrigatórios");
    }

    const db = await getDb();

    // Verificar se a prova existe e pertence ao curso
    const provaExistente = await db.collection("provas").findOne({
      _id: provaOid,
      cursoId: id,
    });

    if (!provaExistente) return notFound("Prova não encontrada");

    // Buscar questões selecionadas (se fornecidas)
    let questoes = provaExistente.questoes || [];
    if (questoesSelecionadas !== undefined) {
      const questoesIds = (questoesSelecionadas || [])
        .map(oid)
        .filter(Boolean);

      if (questoesIds.length > 0) {
        // Buscar todas as questões do banco
        const questoesFromDb = await db
          .collection("questoes")
          .find({ _id: { $in: questoesIds }, cursoIds: id })
          .toArray();
        
        // Reorganizar questões na ordem em que foram selecionadas e adicionar pontuação
        questoes = questoesIds.map(qId => {
          const questao = questoesFromDb.find(q => q._id.equals(qId));
          if (!questao) return null;
          
          // Adicionar pontuação à questão
          const pontuacao = questoesPontuacao?.[qId.toString()] || 0;
          return {
            ...questao,
            pontuacao
          };
        }).filter(Boolean); // Remove questões não encontradas
      } else {
        questoes = [];
      }
    }

    // Atualizar a prova
    const updateData = {
      titulo,
      instrucoes,
      nomeEscola: nomeEscola || "",
      disciplina: disciplina || "",
      professor: professor || "",
      data: data || "",
      duracao: duracao || "",
      valorTotal: valorTotal || "",
      observacoes: observacoes || "",
      questoes,
      atualizadoEm: new Date(),
    };

    await db.collection("provas").updateOne(
      { _id: provaOid },
      { $set: updateData }
    );

    const provaAtualizada = await db.collection("provas").findOne({ _id: provaOid });

    return json({
      message: "Prova atualizada com sucesso",
      prova: {
        ...provaAtualizada,
        id: provaAtualizada?._id.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar prova:", error);
    return serverError("Erro ao atualizar prova");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, provaId: string }> }) {
  try {
    const { provaId } = await params;
    const _id = oid(provaId);
    if (!_id) return badRequest("id inválido");
    
    const db = await getDb();
    const result = await db.collection("provas").deleteOne({ _id });
    
    if (!result.deletedCount) return notFound("prova não encontrada");
    
    return json({ ok: true, message: 'Prova excluída com sucesso!' });
  } catch (e) {
    return serverError(e);
  }
}
