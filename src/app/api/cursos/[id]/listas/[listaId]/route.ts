import { getDb } from "../../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../../lib/http";
import { ObjectId } from "mongodb";

// Helper para validar e converter ID
function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

/**
 * @swagger
 * /api/cursos/{id}/listas/{listaId}:
 * delete:
 * summary: Exclui uma lista de exercícios
 * tags: [Listas de Exercícios]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: ID do curso (não usado na lógica, mas parte da rota)
 * schema:
 * type: string
 * - in: path
 * name: listaId
 * required: true
 * description: ID da lista de exercícios a ser excluída
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Lista excluída com sucesso
 * 400:
 * description: ID da lista inválido
 * 404:
 * description: Lista não encontrada
 * 500:
 * description: Erro no servidor
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, listaId: string }> }) {
  try {
    const { listaId } = await params; 
    const _id = oid(listaId);
    
    if (!_id) return badRequest("ID da lista inválido");
    
    const db = await getDb();
    const result = await db.collection("listasDeExercicios").deleteOne({ _id });
    
    if (!result.deletedCount) return notFound("Lista de exercícios não encontrada");
    
    return json({ ok: true, message: 'Lista de exercícios excluída com sucesso!' });
  } catch (e) {
    return serverError(e);
  }
}