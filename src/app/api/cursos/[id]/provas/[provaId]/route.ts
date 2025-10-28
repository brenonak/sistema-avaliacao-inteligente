import { getDb } from "../../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../../lib/http";
import { ObjectId } from "mongodb";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
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
