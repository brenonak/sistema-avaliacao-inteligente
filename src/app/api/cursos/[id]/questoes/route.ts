import { getDb } from "../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../lib/http";
import { ObjectId } from "mongodb";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

// Adicionar questões a um curso
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: cursoId } = await params;
    const body = await request.json();
    const { questaoIds } = body;

    if (!Array.isArray(questaoIds) || questaoIds.length === 0) {
      return badRequest("questaoIds deve ser um array não vazio");
    }

    const db = await getDb();

    // Verificar se o curso existe
    const _id = oid(cursoId);
    if (!_id) return badRequest("id do curso inválido");
    
    const curso = await db.collection("cursos").findOne({ _id });
    if (!curso) return notFound("curso não encontrado");

    // Adicionar o cursoId ao array cursoIds de cada questão
    const validOids = questaoIds.map(id => oid(id)).filter((id): id is ObjectId => id !== null);
    
    const result = await db.collection("questoes").updateMany(
      { _id: { $in: validOids } },
      { 
        $addToSet: { cursoIds: cursoId },
        $set: { updatedAt: new Date() }
      }
    );

    return json({ 
      success: true, 
      message: `${result.modifiedCount} questão(ões) adicionada(s) ao curso`,
      modifiedCount: result.modifiedCount
    });
  } catch (e) {
    console.error('Erro ao adicionar questões:', e);
    return serverError(e);
  }
}

// Remover questão de um curso
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: cursoId } = await params;
    const url = new URL(request.url);
    const questaoId = url.searchParams.get("questaoId");

    if (!questaoId) {
      return badRequest("questaoId é obrigatório");
    }

    const db = await getDb();

    // Verificar se o curso existe
    const _id = oid(cursoId);
    if (!_id) return badRequest("id do curso inválido");
    
    const curso = await db.collection("cursos").findOne({ _id });
    if (!curso) return notFound("curso não encontrado");

    // Remover o cursoId do array cursoIds da questão
    const questaoOid = oid(questaoId);
    if (!questaoOid) return badRequest("id da questão inválido");

    const result = await db.collection("questoes").updateOne(
      { _id: questaoOid },
      { 
        $pull: { cursoIds: cursoId } as any,
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return notFound("questão não encontrada");
    }

    return json({ 
      success: true, 
      message: "Questão removida do curso",
      modifiedCount: result.modifiedCount
    });
  } catch (e) {
    console.error('Erro ao remover questão:', e);
    return serverError(e);
  }
}
