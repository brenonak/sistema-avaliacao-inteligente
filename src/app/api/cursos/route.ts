import { json, badRequest, serverError } from "../../../lib/http";
import { CursoCreateSchema } from "../../../lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdOrUnauthorized } from "../../../lib/auth-helpers";
import * as CursosService from "../../../services/db/cursos.service";

/**
 * GET /api/cursos
 * Lista todos os cursos do usuário autenticado (com contagem de questões)
 */
export async function GET(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Listar cursos do usuário com contagem de questões
    const cursos = await CursosService.getCursosWithQuestionCount(userId);

    // Formatar resposta - serializar ObjectIds
    const itens = cursos.map(({ _id, ownerId, createdBy, updatedBy, ...rest }) => ({
      id: _id?.toString(),
      ownerId: ownerId?.toString(),
      createdBy: createdBy?.toString(),
      updatedBy: updatedBy?.toString(),
      ...rest,
    }));

    return json({ itens });
  } catch (e) {
    return serverError(e);
  }
}

/**
 * POST /api/cursos
 * Cria um novo curso para o usuário autenticado
 */
export async function POST(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Validar body
    const body = await request.json();
    const parsed = CursoCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Dados inválidos");
    }

    // Verificar se já existe curso com mesmo slug para este usuário
    const existingCurso = await CursosService.getCursoBySlug(userId, parsed.data.slug);
    if (existingCurso) {
      return badRequest("Já existe um curso com este slug");
    }

    // Criar curso (ownerId será injetado automaticamente)
    const curso = await CursosService.createCurso(userId, parsed.data);

    return json(
      {
        id: curso._id?.toString(),
        nome: curso.nome,
        codigo: curso.codigo,
        slug: curso.slug,
        descricao: curso.descricao,
      },
      201
    );
  } catch (e) {
    return serverError(e);
  }
}
