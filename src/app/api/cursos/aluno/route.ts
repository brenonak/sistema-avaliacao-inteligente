import { NextRequest, NextResponse } from "next/server";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";
import { json, serverError } from "../../../../lib/http";
import * as CursosService from "../../../../services/db/cursos.service";

/**
 * GET /api/cursos/aluno
 * Lista cursos em que o aluno está matriculado
 */
export async function GET(request: NextRequest) {
  try {
    // Validar sessão e obter userId (aluno)
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    console.log('[GET /api/cursos/aluno] userId:', userId);

    // Buscar cursos do aluno
    const cursos = await CursosService.getCursosByAluno(userId);

    console.log('[GET /api/cursos/aluno] Cursos encontrados:', cursos.length);

    // Formatar resposta - serializar ObjectIds
    const itens = cursos.map(({ _id, ownerId, createdBy, updatedBy, alunosIds, ...rest }) => ({
      id: _id?.toString(),
      ownerId: ownerId?.toString(),
      createdBy: createdBy?.toString(),
      updatedBy: updatedBy?.toString(),
      ...rest,
    }));

    return json({ itens });
  } catch (e) {
    console.error('[GET /api/cursos/aluno] Erro:', e);
    return serverError(e);
  }
}
