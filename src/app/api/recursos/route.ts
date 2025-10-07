import { NextRequest } from "next/server";
import { json, serverError } from "../../../lib/http";
import { getTopRecursos } from "../../../lib/resources";

export const dynamic = "force-dynamic"; // evita cache SSR em dev

// GET /recursos - Listar imagens por frequência
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
    const skipParam = url.searchParams.get("skip");
    const pageParam = url.searchParams.get("page");
    const skip = skipParam !== null ? Math.max(Number(skipParam) || 0, 0) : Math.max(((Number(pageParam) || 1) - 1) * limit, 0);
    const page = skipParam !== null ? Math.floor(skip / limit) + 1 : Math.max(Number(pageParam) || 1, 1);

    // Obter recursos ordenados por frequência de uso (counter)
    const recursos = await getTopRecursos(limit);

    // Normalizar _id para id string
    const items = recursos.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { 
        id: _id?.toString?.() ?? _id, 
        ...rest 
      };
    });

    return json({ 
      items, 
      page, 
      limit, 
      total: items.length,
      // Preparação para paginação futura
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: items.length,
        hasMore: false // Implementação atual retorna todos os itens
      }
    });
  } catch (e) {
    console.error("Erro ao listar recursos:", e);
    return serverError(e);
  }
}