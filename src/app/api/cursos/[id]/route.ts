import { json, notFound, badRequest, serverError } from "../../../../lib/http";
import { CursoUpdateSchema } from "../../../../lib/validation";
import { NextResponse } from "next/server";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";
import * as CursosService from "../../../../services/db/cursos.service";
import * as QuestoesService from "../../../../services/db/questoes.service";

/**
 * GET /api/cursos/[id]
 * Busca um curso específico do usuário (com suas questões)
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Buscar curso (apenas se pertencer ao usuário)
    const curso = await CursosService.getCursoById(userId, id);
    if (!curso) {
      return notFound("Curso não encontrado");
    }

    // Buscar questões associadas a este curso (do mesmo usuário)
    const questoes = await QuestoesService.listQuestoes(userId, {
      cursoIds: [id],
    });

    // Formatar resposta - serializar ObjectIds
    const questoesFormatadas = questoes.map(({ _id, ownerId, createdBy, updatedBy, cursoIds, imagemIds, ...rest }) => ({
      id: _id?.toString(),
      ownerId: ownerId?.toString(),
      createdBy: createdBy?.toString(),
      updatedBy: updatedBy?.toString(),
      cursoIds: Array.isArray(cursoIds) ? cursoIds.map((id: any) => id?.toString()) : [],
      imagemIds: Array.isArray(imagemIds) ? imagemIds.map((id: any) => id?.toString()) : [],
      ...rest,
    }));

    return json({
      id: curso._id?.toString(),
      ownerId: curso.ownerId?.toString(),
      createdBy: curso.createdBy?.toString(),
      updatedBy: curso.updatedBy?.toString(),
      nome: curso.nome,
      codigo: curso.codigo,
      slug: curso.slug,
      descricao: curso.descricao,
      questoes: questoesFormatadas,
    });
  } catch (e) {
    return serverError(e);
  }
}

/**
 * PUT /api/cursos/[id]
 * Atualiza um curso (apenas se pertencer ao usuário)
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Validar body
    const body = await request.json();
    const parsed = CursoUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Dados inválidos");
    }

    // Atualizar curso (apenas se pertencer ao usuário)
    const cursoAtualizado = await CursosService.updateCurso(userId, id, parsed.data);
    
    if (!cursoAtualizado) {
      return notFound("Curso não encontrado");
    }

    return json({
      id: cursoAtualizado._id?.toString(),
      ownerId: cursoAtualizado.ownerId?.toString(),
      createdBy: cursoAtualizado.createdBy?.toString(),
      updatedBy: cursoAtualizado.updatedBy?.toString(),
      nome: cursoAtualizado.nome,
      codigo: cursoAtualizado.codigo,
      slug: cursoAtualizado.slug,
      descricao: cursoAtualizado.descricao,
    });
  } catch (e) {
    return serverError(e);
  }
}

/**
 * DELETE /api/cursos/[id]
 * Deleta um curso (apenas se pertencer ao usuário)
 * Nota: Questões associadas não são deletadas, apenas desreferenciadas
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Deletar curso (apenas se pertencer ao usuário)
    const deleted = await CursosService.deleteCurso(userId, id);
    
    if (!deleted) {
      return notFound("Curso não encontrado");
    }

    // TODO: Considerar desreferenciar este curso das questões
    // Isso pode ser feito em um hook/listener ou aqui mesmo
    // Por ora, deixamos as questões com a referência órfã

    return json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
