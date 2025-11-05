import { json, notFound, badRequest, serverError } from "../../../../lib/http";
import { QuestaoUpdateSchema } from "../../../../lib/validation";
import { decrementResourceUsage, incrementResourceUsage } from "../../../../lib/resources";
import { NextResponse } from "next/server";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";
import * as QuestoesService from "../../../../services/db/questoes.service";

/**
 * GET /api/questoes/[id]
 * Busca uma questão específica do usuário
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Buscar questão (apenas se pertencer ao usuário)
    const questao = await QuestoesService.getQuestaoById(userId, id);
    if (!questao) {
      return notFound("Questão não encontrada");
    }

    // Formatar resposta - serializar ObjectIds
    const { _id, ownerId, createdBy, updatedBy, cursoIds, imagemIds, ...rest } = questao;
    return json({ 
      id: _id?.toString(),
      ownerId: ownerId?.toString(),
      createdBy: createdBy?.toString(),
      updatedBy: updatedBy?.toString(),
      cursoIds: Array.isArray(cursoIds) ? cursoIds.map((id: any) => id?.toString()) : [],
      imagemIds: Array.isArray(imagemIds) ? imagemIds.map((id: any) => id?.toString()) : [],
      ...rest 
    });
  } catch (e) {
    return serverError(e);
  }
}

/**
 * PUT /api/questoes/[id]
 * Atualiza uma questão (apenas se pertencer ao usuário)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Validar body
    const body = await request.json();
    const parsed = QuestaoUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Dados inválidos");
    }

    // Buscar questão atual para gerenciar recursos
    const questaoAtual = await QuestoesService.getQuestaoById(userId, id);
    if (!questaoAtual) {
      return notFound("Questão não encontrada");
    }

    // Gerenciar refCount de recursos (se fornecidos no body)
    if (body.recursos !== undefined) {
      const recursosAntigos = Array.isArray((questaoAtual as any).recursos) 
        ? (questaoAtual as any).recursos 
        : [];
      const recursosNovos = Array.isArray(body.recursos) ? body.recursos : [];

      const removidos = recursosAntigos.filter((r: string) => !recursosNovos.includes(r));
      const adicionados = recursosNovos.filter((r: string) => !recursosAntigos.includes(r));

      if (removidos.length > 0) {
        void decrementResourceUsage(removidos).catch(() => {});
      }

      if (adicionados.length > 0) {
        void incrementResourceUsage(adicionados).catch(() => {});
      }
    }

    // Preparar dados de atualização
    const updateData: any = { ...parsed.data };
    
    // Adicionar campos extras do body (que não estão no schema)
    if (body.cursoIds) updateData.cursoIds = body.cursoIds;
    if (body.imagemIds) updateData.imagemIds = body.imagemIds;
    if (body.recursos) updateData.recursos = body.recursos;

    // Atualizar questão (validará ownership de cursos/imagens automaticamente)
    try {
      const questaoAtualizada = await QuestoesService.updateQuestao(userId, id, updateData);

      if (!questaoAtualizada) {
        return notFound("Questão não encontrada");
      }

      const { _id, ownerId, createdBy, updatedBy, cursoIds, imagemIds, ...rest } = questaoAtualizada;
      return json({ 
        id: _id?.toString(),
        ownerId: ownerId?.toString(),
        createdBy: createdBy?.toString(),
        updatedBy: updatedBy?.toString(),
        cursoIds: Array.isArray(cursoIds) ? cursoIds.map((id: any) => id?.toString()) : [],
        imagemIds: Array.isArray(imagemIds) ? imagemIds.map((id: any) => id?.toString()) : [],
        ...rest 
      });
    } catch (error: any) {
      if (error.message?.includes("Owner mismatch")) {
        return badRequest(error.message);
      }
      throw error;
    }
  } catch (e) {
    return serverError(e);
  }
}

/**
 * DELETE /api/questoes/[id]
 * Deleta uma questão (apenas se pertencer ao usuário)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Buscar questão para obter recursos antes de deletar
    const questao = await QuestoesService.getQuestaoById(userId, id);
    if (!questao) {
      return notFound("Questão não encontrada");
    }

    // Extrair IDs dos recursos
    const recursoIds = Array.isArray((questao as any).recursos) ? (questao as any).recursos : [];

    // Deletar questão (apenas se pertencer ao usuário)
    const deleted = await QuestoesService.deleteQuestao(userId, id);

    if (!deleted) {
      return notFound("Questão não encontrada");
    }

    // Decrementar refCount dos recursos associados
    if (recursoIds.length > 0) {
      void decrementResourceUsage(recursoIds).catch(() => {});
    }

    return json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}