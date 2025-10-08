import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../../lib/http";
import { incrementResourceUsage, decrementResourceUsage } from "../../../../../../lib/resources";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

// POST /questoes/:id/recurso/:idRecurso - Adicionar recurso existente a uma questão
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string, idRecurso: string } }
) {
  try {
    const questaoId = oid(params.id);
    const recursoId = params.idRecurso;
    
    if (!questaoId) return badRequest("ID de questão inválido");
    if (!recursoId) return badRequest("ID de recurso inválido");

    // Verificar se a questão existe
    const db = await getDb();
    const questao = await db.collection("questoes").findOne({ _id: questaoId });
    if (!questao) return notFound("Questão não encontrada");

    // Verificar se o recurso existe
    const recursoOid = oid(recursoId);
    if (!recursoOid) return badRequest("ID de recurso inválido");
    
    const recurso = await db.collection("recursos").findOne({ _id: recursoOid });
    if (!recurso) return notFound("Recurso não encontrado");

    // Associar o recurso à questão se ainda não estiver associado
    const recursos = Array.isArray(questao.recursos) ? questao.recursos : [];
    if (!recursos.includes(recursoId)) {
      await db.collection("questoes").updateOne(
        { _id: questaoId },
        { 
          $push: { recursos: recursoId } as any,
          $set: { updatedAt: new Date() }
        }
      );
      
      // Incrementar o contador de uso do recurso
      await incrementResourceUsage([recursoId]);
    }

    return json({
      success: true,
      message: "Recurso adicionado à questão com sucesso",
      recurso: {
        id: recursoId,
        url: recurso.url,
        filename: recurso.filename
      }
    });
  } catch (e) {
    console.error("Erro ao adicionar recurso existente:", e);
    return serverError(e);
  }
}

// DELETE /questoes/:id/recurso/:idRecurso - Remover recurso de uma questão
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, idRecurso: string } }
) {
  try {
    const questaoId = oid(params.id);
    const recursoId = params.idRecurso;
    
    if (!questaoId) return badRequest("ID de questão inválido");
    if (!recursoId) return badRequest("ID de recurso inválido");

    // Verificar se a questão existe
    const db = await getDb();
    const questao = await db.collection("questoes").findOne({ _id: questaoId });
    if (!questao) return notFound("Questão não encontrada");

    // Verificar se o recurso está associado à questão
    const recursos = Array.isArray(questao.recursos) ? questao.recursos : [];
    if (!recursos.includes(recursoId)) {
      return badRequest("Recurso não está associado a esta questão");
    }

    // Remover a referência ao recurso na questão
    await db.collection("questoes").updateOne(
      { _id: questaoId },
      { 
        $pull: { recursos: recursoId } as any,
        $set: { updatedAt: new Date() }
      }
    );
    
    // Decrementar o contador de uso do recurso
    await decrementResourceUsage([recursoId]);

    return json({
      success: true,
      message: "Recurso removido da questão com sucesso"
    });
  } catch (e) {
    console.error("Erro ao remover recurso:", e);
    return serverError(e);
  }
}