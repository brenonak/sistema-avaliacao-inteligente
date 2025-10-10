import { getDb } from "../../../lib/mongodb";
import { json, badRequest, serverError } from "../../../lib/http";
import { QuestaoCreateSchema } from "../../../lib/validation";
import { NextRequest } from "next/server";
import { getRecursoByUrl, incrementResourceUsage } from "../../../lib/resources";

export const dynamic = "force-dynamic"; // evita cache SSR em dev

// Helpers de tags
function normalizeTagValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const norm = value.trim().toLowerCase();
  return norm.length > 0 ? norm : null;
}

function sanitizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const n = normalizeTagValue(raw);
    if (n && !seen.has(n)) {
      seen.add(n);
      normalized.push(n);
      if (normalized.length >= 10) break;
    }
  }
  return normalized;
}

// Para filtros de query
function parseTagFilterFromQuery(url: URL): { mode: "none" | "any"; values: string[] } {
  const tagsParam = url.searchParams.get("tags");
  const tagParam = url.searchParams.get("tag");

  const listFromTags = (tagsParam || "")
    .split(",")
    .map((s) => normalizeTagValue(s))
    .filter((s): s is string => !!s);
  const fromTag = normalizeTagValue(tagParam);

  const combined = fromTag ? [fromTag, ...listFromTags] : listFromTags;
  const unique: string[] = Array.from(new Set(combined)).slice(0, 10);
  if (unique.length > 0) return { mode: "any", values: unique };
  return { mode: "none", values: [] };
}

// Índices
async function ensureIndexes() {
  try {
    const db = await getDb();
    const col = db.collection("questoes");
    // dispara sem aguardar para não bloquear requisição
    void col.createIndex({ tags: 1 }, { name: "idx_tags_1", background: true });
    void col.createIndex({ createdAt: -1 }, { name: "idx_createdAt_desc", background: true });
    void col.createIndex({ createdAt: 1 }, { name: "idx_createdAt_asc", background: true });
    void col.createIndex({ updatedAt: -1 }, { name: "idx_updatedAt_desc", background: true });
    void col.createIndex({ updatedAt: 1 }, { name: "idx_updatedAt_asc", background: true });
  } catch {
    // silencioso: não falhar request por causa de índice
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
    const skipParam = url.searchParams.get("skip");
    const pageParam = url.searchParams.get("page");
    const skip = skipParam !== null ? Math.max(Number(skipParam) || 0, 0) : Math.max(((Number(pageParam) || 1) - 1) * limit, 0);
    const page = skipParam !== null ? Math.floor(skip / limit) + 1 : Math.max(Number(pageParam) || 1, 1);

    // Parâmetros de ordenação
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    
    // Validar parâmetros de ordenação
    const validSortFields = ["createdAt", "updatedAt"];
    const validSortOrders = ["asc", "desc"];
    
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : "desc";
    
    const sortObject = { [finalSortBy]: finalSortOrder === "desc" ? -1 : 1 };

    const tagFilter = parseTagFilterFromQuery(url);

    const db = await getDb();
    const filter: any = {};
    if (tipo) filter.tipo = tipo;
    if (tagFilter.mode === "any") {
      filter.tags = { $in: tagFilter.values };
    }

    // criar índices 
    void ensureIndexes();

    const [rawItems, total] = await Promise.all([
      db.collection("questoes")
        .find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("questoes").countDocuments(filter),
    ]);

    // Normaliza _id para id string
    const items = rawItems.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id?.toString?.() ?? _id, ...rest, tags: Array.isArray((rest as any).tags) ? (rest as any).tags : [] };
    });
    return json({ items, page, limit, total });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = QuestaoCreateSchema.safeParse(body);
    if (!parsed.success) {
        return badRequest(parsed.error.issues.map(i => i.message).join("; "));
    }

    const tags = sanitizeTags((body as any)?.tags);

    // Resolve recursos: accept array of resource URLs or IDs in body.recursos
    const rawRecursos = Array.isArray((body as any)?.recursos) ? (body as any).recursos : [];
    const recursoIds: string[] = [];
    for (const item of rawRecursos) {
      if (typeof item === "string") {
        // try as ObjectId string first; if not, treat as URL
        if (/^[a-f\d]{24}$/i.test(item)) {
          recursoIds.push(item);
        } else {
          const rec = await getRecursoByUrl(item);
          if (rec?._id) recursoIds.push(rec._id.toString());
        }
      } else if (item && typeof item === "object") {
        if (typeof (item as any).id === "string") recursoIds.push((item as any).id);
        else if (typeof (item as any).url === "string") {
          const rec = await getRecursoByUrl((item as any).url);
          if (rec?._id) recursoIds.push(rec._id.toString());
        }
      }
    }

    const doc = {
      ...parsed.data,
      tags,
      recursos: recursoIds, // references
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDb();
    void ensureIndexes();
    const res = await db.collection("questoes").insertOne(doc);
    // increment usage for linked resources
    void incrementResourceUsage(recursoIds).catch(() => {});
    return json({ id: res.insertedId.toString(), ...doc }, 201);
  } catch (e) {
    return serverError(e);
  }
}