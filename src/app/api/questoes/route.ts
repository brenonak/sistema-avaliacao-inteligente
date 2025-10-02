import { getDb } from "../../../lib/mongodb";
import { json, badRequest, serverError } from "../../../lib/http";
import { QuestaoCreateSchema } from "../../../lib/validation";
import { NextRequest } from "next/server";

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
        .sort({ createdAt: -1 })
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

    const doc = {
      ...parsed.data,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDb();
    void ensureIndexes();
    const res = await db.collection("questoes").insertOne(doc);
  return json({ id: res.insertedId.toString(), ...doc }, 201);
  } catch (e) {
    return serverError(e);
  }
}