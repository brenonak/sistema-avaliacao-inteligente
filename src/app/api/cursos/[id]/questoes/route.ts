import { getDb } from "../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../lib/http";
import { ObjectId } from "mongodb";
import { getUserIdOrUnauthorized } from "../../../../../lib/auth-helpers";
import { NextResponse } from "next/server";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

/**
 * POST /api/cursos/:id/questoes
 * Adiciona questões existentes a um curso
 * Body: { questaoIds: string[] }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validar autenticação
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const { id: cursoId } = await params;
    const body = await request.json();
    const { questaoIds } = body;

    if (!Array.isArray(questaoIds) || questaoIds.length === 0) {
      return badRequest("questaoIds deve ser um array não vazio");
    }

    const db = await getDb();

    // Verificar se o curso existe e pertence ao usuário
    const cursoOid = oid(cursoId);
    if (!cursoOid) return badRequest("id do curso inválido");
    
    const curso = await db.collection("cursos").findOne({ 
      _id: cursoOid,
      ownerId: new ObjectId(userId)
    });
    
    if (!curso) {
      return notFound("Curso não encontrado ou você não tem permissão para modificá-lo");
    }

    // Converter questaoIds para ObjectIds
    const questaoOids = questaoIds.map(id => oid(id)).filter((id): id is ObjectId => id !== null);
    
    if (questaoOids.length === 0) {
      return badRequest("Nenhum ID de questão válido fornecido");
    }

    // Verificar se as questões existem e pertencem ao usuário
    const questoesCount = await db.collection("questoes").countDocuments({
      _id: { $in: questaoOids },
      ownerId: new ObjectId(userId)
    });

    if (questoesCount !== questaoOids.length) {
      return badRequest(`Algumas questões não foram encontradas ou não pertencem a você. Encontradas: ${questoesCount}/${questaoOids.length}`);
    }

    // Adicionar o cursoId (como ObjectId) ao array cursoIds de cada questão
    const result = await db.collection("questoes").updateMany(
      { 
        _id: { $in: questaoOids },
        ownerId: new ObjectId(userId)
      },
      { 
        $addToSet: { cursoIds: cursoOid }, // Usar ObjectId, não string
        $set: { 
          updatedAt: new Date(),
          updatedBy: new ObjectId(userId)
        }
      }
    );

    return json({ 
      success: true, 
      message: `${result.modifiedCount} questão(ões) adicionada(s) ao curso`,
      modifiedCount: result.modifiedCount,
      matched: result.matchedCount
    });
  } catch (e) {
    console.error('Erro ao adicionar questões:', e);
    return serverError(e);
  }
}

/**
 * GET /api/cursos/:id/questoes
 * Busca todas as questões de um curso
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validar autenticação
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const { id: cursoId } = await params;
    const db = await getDb();

    const cursoOid = oid(cursoId);
    if (!cursoOid) return badRequest("id do curso inválido");

    // Verificar se o curso existe e pertence ao usuário
    const curso = await db.collection("cursos").findOne({ 
      _id: cursoOid,
      ownerId: new ObjectId(userId)
    });
    
    if (!curso) {
      return notFound("Curso não encontrado ou você não tem permissão para acessá-lo");
    }

    // Buscar todas as questões que têm o cursoId no array cursoIds (como ObjectId)
    const questoes = await db.collection("questoes")
      .find({ 
        cursoIds: cursoOid, // Buscar por ObjectId
        ownerId: new ObjectId(userId)
      })
      .toArray();

    // Serializar ObjectIds
    const questoesSerializadas = questoes.map(q => ({
      ...q,
      _id: q._id?.toString(),
      ownerId: q.ownerId?.toString(),
      createdBy: q.createdBy?.toString(),
      updatedBy: q.updatedBy?.toString(),
      cursoIds: q.cursoIds?.map((id: any) => id.toString()) || [],
      imagemIds: q.imagemIds?.map((id: any) => id.toString()) || [],
    }));

    return json({ items: questoesSerializadas, total: questoesSerializadas.length });
  } catch (e) {
    console.error("Erro ao buscar questões do curso:", e);
    return serverError(e);
  }
}

/**
 * DELETE /api/cursos/:id/questoes?questaoId=xxx
 * Remove uma questão de um curso
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validar autenticação
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const { id: cursoId } = await params;
    const url = new URL(request.url);
    const questaoId = url.searchParams.get("questaoId");

    if (!questaoId) {
      return badRequest("questaoId é obrigatório");
    }

    const db = await getDb();

    // Verificar se o curso existe e pertence ao usuário
    const cursoOid = oid(cursoId);
    if (!cursoOid) return badRequest("id do curso inválido");
    
    const curso = await db.collection("cursos").findOne({ 
      _id: cursoOid,
      ownerId: new ObjectId(userId)
    });
    
    if (!curso) {
      return notFound("Curso não encontrado ou você não tem permissão para modificá-lo");
    }

    // Remover o cursoId (como ObjectId) do array cursoIds da questão
    const questaoOid = oid(questaoId);
    if (!questaoOid) return badRequest("id da questão inválido");

    const result = await db.collection("questoes").updateOne(
      { 
        _id: questaoOid,
        ownerId: new ObjectId(userId) // Garantir que a questão pertence ao usuário
      },
      { 
        $pull: { cursoIds: cursoOid } as any, // Remover ObjectId, não string
        $set: { 
          updatedAt: new Date(),
          updatedBy: new ObjectId(userId)
        }
      }
    );

    if (result.matchedCount === 0) {
      return notFound("Questão não encontrada ou você não tem permissão para modificá-la");
    }

    return json({ 
      success: true, 
      message: "Questão removida do curso",
      modifiedCount: result.modifiedCount
    });
  } catch (e) {
    console.error('Erro ao remover questão:', e);
    return serverError(e);
  }
}
