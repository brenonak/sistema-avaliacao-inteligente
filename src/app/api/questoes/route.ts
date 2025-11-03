import { getDb } from "../../../lib/mongodb";
import { json, badRequest, serverError } from "../../../lib/http";
import { QuestaoCreateSchema } from "../../../lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { getRecursoByUrl, incrementResourceUsage } from "../../../lib/resources";
import { getUserIdOrUnauthorized } from "../../../lib/auth-helpers";
import * as QuestoesService from "../../../services/db/questoes.service";

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
    void col.createIndex({ enunciado: "text" }, { name: "idx_enunciado_text", background: true });
  } catch {
    // silencioso: não falhar request por causa de índice
  }
}

/**
 * GET /api/questoes
 * Lista questões do usuário autenticado (com filtros e paginação)
 */
export async function GET(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo") || undefined;
    const dificuldade = url.searchParams.get("dificuldade") || undefined;
    
    // Parse filtros de tags
    const tagFilter = parseTagFilterFromQuery(url);
    const tags = tagFilter.mode === "any" ? tagFilter.values : undefined;
    
    // Parse filtro de cursos
    const cursoParam = url.searchParams.get("curso");
    const cursoIds = cursoParam ? [cursoParam] : undefined;

    // Buscar questões do usuário com filtros
    const questoes = await QuestoesService.listQuestoes(userId, {
      tipo,
      dificuldade,
      tags,
      cursoIds,
    });

    // Paginação (aplicada após buscar do DB)
    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
    const pageParam = url.searchParams.get("page");
    const page = Math.max(Number(pageParam) || 1, 1);
    const skip = (page - 1) * limit;
    
    const total = questoes.length;
    const paginatedQuestoes = questoes.slice(skip, skip + limit);

    // Formatar resposta - serializar ObjectIds
    const items = paginatedQuestoes.map((doc: any) => {
      const { _id, ownerId, createdBy, updatedBy, cursoIds, imagemIds, ...rest } = doc;
      return { 
        id: _id?.toString?.() ?? _id,
        ownerId: ownerId?.toString(),
        createdBy: createdBy?.toString(),
        updatedBy: updatedBy?.toString(),
        cursoIds: Array.isArray(cursoIds) ? cursoIds.map((id: any) => id?.toString()) : [],
        imagemIds: Array.isArray(imagemIds) ? imagemIds.map((id: any) => id?.toString()) : [],
        ...rest, 
        tags: Array.isArray(rest.tags) ? rest.tags : [] 
      };
    });

    return json({ items, page, limit, total });
  } catch (e) {
    return serverError(e);
  }
}

/**
 * POST /api/questoes
 * Cria uma nova questão para o usuário autenticado
 */
export async function POST(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const body = await request.json();
    const parsed = QuestaoCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map(i => i.message).join("; "));
    }

    // Sanitizar tags
    const tags = sanitizeTags((body as any)?.tags);

    // Resolver recursos (se fornecidos)
    const rawRecursos = Array.isArray((body as any)?.recursos) ? (body as any).recursos : [];
    const recursoIds: string[] = [];
    for (const item of rawRecursos) {
      if (typeof item === "string") {
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

    // Preparar dados para criar questão
    // Garantir que cursoIds e imagemIds são arrays de strings válidas
    const cursoIds = Array.isArray(body.cursoIds) 
      ? body.cursoIds.filter((id: any) => typeof id === 'string' && id.length === 24)
      : [];
    
    const imagemIds = Array.isArray(body.imagemIds) 
      ? body.imagemIds.filter((id: any) => typeof id === 'string' && id.length === 24)
      : [];

    console.log('[POST /api/questoes] Criando questão:', {
      userId,
      tipo: parsed.data.tipo,
      cursoIds,
      imagemIds,
      tagsCount: tags.length
    });

    const questaoData = {
      ...parsed.data,
      tags,
      cursoIds,
      imagemIds,
    };

    // Criar questão (validará ownership de cursos/imagens automaticamente)
    try {
      const questao = await QuestoesService.createQuestao(userId, questaoData);

      // Incrementar uso de recursos vinculados (se houver)
      if (recursoIds.length > 0) {
        void incrementResourceUsage(recursoIds).catch(() => {});
      }

      return json(
        {
          id: questao._id?.toString(),
          enunciado: questao.enunciado,
          alternativas: questao.alternativas,
          tags: questao.tags,
          tipo: questao.tipo,
          dificuldade: questao.dificuldade,
          cursoIds: questao.cursoIds,
        },
        201
      );
    } catch (error: any) {
      // Se houver erro de ownership mismatch, retornar 400
      if (error.message?.includes("Owner mismatch")) {
        return badRequest(error.message);
      }
      throw error;
    }
  } catch (e) {
    return serverError(e);
  }
}