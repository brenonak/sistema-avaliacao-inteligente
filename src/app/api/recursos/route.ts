import { NextRequest } from "next/server";
import { json, serverError } from "../../../lib/http";
import { getTopRecursos } from "../../../lib/resources";

export const dynamic = "force-dynamic"; // evita cache SSR em dev

// GET /recursos - Listar imagens por frequência
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
    
    // Obter recursos ordenados por frequência de uso (counter)
    const recursos = await getTopRecursos(limit);
    
    if (!recursos) {
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