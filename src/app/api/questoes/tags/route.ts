import { getDb } from "../../../../lib/mongodb";
import { json, serverError } from "../../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    
    // Buscar todas as tags únicas das questões
    const tags = await db.collection("questoes").distinct("tags");
    
    // Filtrar tags válidas e ordenar alfabeticamente
    const validTags = tags
      .filter(tag => typeof tag === "string" && tag.trim().length > 0)
      .map(tag => tag.trim().toLowerCase())
      .sort();
    
    // Remover duplicatas (caso existam)
    const uniqueTags = Array.from(new Set(validTags));
    
    return json({ tags: uniqueTags });
  } catch (e) {
    return serverError(e);
  }
}
