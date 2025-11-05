import { NextResponse } from "next/server";
import { json, serverError } from "../../../../lib/http";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";
import * as QuestoesService from "../../../../services/db/questoes.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/questoes/tags
 * Lista tags únicas das questões do usuário autenticado
 */
export async function GET() {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Buscar tags únicas das questões do usuário
    const tags = await QuestoesService.getQuestaoTags(userId);
    
    // Filtrar tags válidas e ordenar alfabeticamente
    const validTags = tags
      .filter(tag => typeof tag === "string" && tag.trim().length > 0)
      .map(tag => tag.trim().toLowerCase())
      .sort();
    
    // Remover duplicatas
    const uniqueTags = Array.from(new Set(validTags));
    
    return json({ tags: uniqueTags });
  } catch (e) {
    return serverError(e);
  }
}
