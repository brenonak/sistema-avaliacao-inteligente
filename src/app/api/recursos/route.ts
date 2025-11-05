import { NextRequest, NextResponse } from "next/server";
import { json } from "../../../lib/http";
import { getTopRecursos } from "../../../lib/resources";
import { getUserIdOrUnauthorized } from "../../../lib/auth-helpers";

export const dynamic = "force-dynamic"; // evita cache SSR em dev

/**
 * GET /api/recursos
 * Lista recursos (imagens) do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 100), 200);
    
    // Obter recursos do usuário ordenados por frequência de uso (counter)
    const recursos = await getTopRecursos(userId, limit);
    
    console.log(`[GET /api/recursos] userId: ${userId}`);
    
    console.log(`[GET /api/recursos] Encontrados ${recursos?.length || 0} recursos no banco`);
    
    if (!recursos || recursos.length === 0) {
      console.log("[GET /api/recursos] Nenhum recurso encontrado");
      return json({ items: [], total: 0 });
    }

    // Normalizar _id para id string e garantir que todos os campos necessários existam
    const items = recursos.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { 
        id: _id?.toString?.() ?? _id, 
        url: rest.url,
        filename: rest.filename || 'Sem nome',
        updatedAt: rest.updatedAt || rest.createdAt || new Date().toISOString(),
        createdAt: rest.createdAt || new Date().toISOString(),
        sizeBytes: rest.sizeBytes || 0,
        ...rest 
      };
    }).filter(item => item.url); // Garantir que só retornamos itens com URL

    console.log(`[GET /api/recursos] Retornando ${items.length} itens com URL válida`);

    return json({ 
      items, 
      total: items.length,
    });
  } catch (e) {
    console.error("Erro ao listar recursos:", e);
    // Retornar uma lista vazia em vez de erro 500 para não quebrar a UI
    return json({ 
      items: [], 
      total: 0,
      error: e instanceof Error ? e.message : "Erro ao listar recursos" 
    });
  }
}