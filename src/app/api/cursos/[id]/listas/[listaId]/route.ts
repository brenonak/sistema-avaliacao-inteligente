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

// Atualiza uma lista de exercícios existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; listaId: string }> }
) {
  try {
    const { id: cursoId, listaId } = await params;
    const cursoOid = oid(cursoId);
    const listaOid = oid(listaId);

    if (!cursoOid || !listaOid) return badRequest("IDs inválidos");

    const body = await request.json();
    const {
      tituloLista,
      nomeInstituicao,
      questoesIds, // Array de IDs
    } = body;

    if (!tituloLista) {
      return badRequest("Nome da matéria é obrigatório");
    }

    const db = await getDb();

    // Verificar se a lista existe e pertence ao curso
    const listaExistente = await db.collection("listasDeExercicios").findOne({
      _id: listaOid,
      cursoId: cursoId,
    });

    if (!listaExistente) return notFound("Lista de exercícios não encontrada");

    // Atualizar a lista
    const updateData = {
      tituloLista,
      nomeInstituicao: nomeInstituicao || "",
      questoesIds: Array.isArray(questoesIds) ? questoesIds : [], // Garante que é um array
      atualizadoEm: new Date(),
    };

    await db.collection("listasDeExercicios").updateOne(
      { _id: listaOid },
      { $set: updateData }
    );

    const listaAtualizada = await db.collection("listasDeExercicios").findOne({ _id: listaOid });

    return json({
      message: "Lista atualizada com sucesso",
      lista: {
        ...listaAtualizada,
        id: listaAtualizada?._id.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar lista:", error);
    return serverError("Erro ao atualizar lista");
  }
}

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