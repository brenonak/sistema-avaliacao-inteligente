import { NextRequest } from "next/server";
import { json, badRequest, notFound, serverError } from "../../../../../lib/http";
import { incrementResourceUsage, getRecursoById } from "../../../../../lib/resources";

// POST /api/recursos/[id]/increment - Incrementar o refCount de um recurso
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return badRequest("ID de recurso inválido");
    }

    // Verificar se o recurso existe
    const recurso = await getRecursoById(id);
    if (!recurso) {
      return notFound("Recurso não encontrado");
    }

    // Incrementar o contador de uso
    await incrementResourceUsage([id]);

    return json({
      success: true,
      message: "Contador de uso incrementado com sucesso",
      refCount: (recurso.usage?.refCount || 0) + 1
    });
  } catch (e) {
    console.error("Erro ao incrementar contador de uso:", e);
    return serverError(e);
  }
}
