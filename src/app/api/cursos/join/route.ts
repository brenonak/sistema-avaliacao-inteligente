import { NextRequest, NextResponse } from "next/server";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";
import { json, badRequest, serverError } from "../../../../lib/http";
import * as CursosService from "../../../../services/db/cursos.service";

/**
 * POST /api/cursos/join
 * Aluno entra em um curso usando o código do curso
 */
export async function POST(request: NextRequest) {
  try {
    // Validar sessão e obter userId (aluno)
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Validar body
    const body = await request.json();
    const { codigo } = body;

    if (!codigo || typeof codigo !== "string") {
      return badRequest("Código do curso é obrigatório");
    }

    console.log('[POST /api/cursos/join] userId:', userId, 'codigo:', codigo);

    // Buscar curso pelo código
    const curso = await CursosService.getCursoByCodigo(codigo.trim());

    if (!curso) {
      return NextResponse.json(
        { error: "Curso não encontrado com este código" },
        { status: 404 }
      );
    }

    // Verificar se o aluno já está matriculado
    const alunoId = userId;
    const jaMatriculado = curso.alunosIds?.some(
      (id) => id.toString() === alunoId
    );

    if (jaMatriculado) {
      return badRequest("Você já está matriculado neste curso");
    }

    // Adicionar aluno ao curso
    const cursoAtualizado = await CursosService.addAlunoToCurso(
      curso._id!.toString(),
      alunoId
    );

    if (!cursoAtualizado) {
      return serverError("Erro ao matricular no curso");
    }

    return json(
      {
        message: "Matriculado com sucesso",
        curso: {
          id: cursoAtualizado._id?.toString(),
          nome: cursoAtualizado.nome,
          codigo: cursoAtualizado.codigo,
          descricao: cursoAtualizado.descricao,
        },
      },
      201
    );
  } catch (e) {
    console.error('[POST /api/cursos/join] Erro:', e);
    return serverError(e);
  }
}
