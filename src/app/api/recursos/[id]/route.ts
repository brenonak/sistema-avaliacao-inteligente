import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../lib/http";
import { deleteRecurso, getRecursoById } from "../../../../lib/resources";
import { del } from "@vercel/blob";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

// DELETE /recursos/:id - Remover imagem do banco e blob storage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return badRequest("ID de recurso inválido");

    // Verificar se o recurso existe
    const recurso = await getRecursoById(id);
    if (!recurso) return notFound("Recurso não encontrado");

    // Verificar se o recurso está em uso
    if (recurso.usage.refCount > 0) {
      return json({
        success: false,
        message: "Não é possível excluir um recurso que está em uso por questões"
      }, { status: 400 });
    }

    // Remover todas as referências a este recurso em todas as questões
    const db = await getDb();
    await db.collection("questoes").updateMany(
      { recursos: id },
      { 
        $pull: { recursos: id } as any,
        $set: { updatedAt: new Date() }
      }
    );

    // Remover o documento recurso da coleção recursos
    const deleteResult = await deleteRecurso(id);
    if (!deleteResult) {
      return json({
        success: false,
        message: "Falha ao excluir o recurso do banco de dados"
      }, { status: 500 });
    }

    // Remover o arquivo do blob storage
    if (recurso.key) {
      try {
        await del(recurso.key);
      } catch (error) {
        console.error("Erro ao excluir arquivo do blob storage:", error);
        // Continua mesmo se falhar a exclusão do blob
        // O registro já foi removido do banco
      }
    }

    return json({
      success: true,
      message: "Recurso removido com sucesso"
    });
  } catch (e) {
    console.error("Erro ao excluir recurso:", e);
    return serverError(e);
  }
}