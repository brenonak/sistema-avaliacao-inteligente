import { getDb } from "../../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../../lib/http";
import { ObjectId } from "mongodb";
import { getUserIdOrUnauthorized } from "../../../../../../lib/auth-helpers";
import { NextResponse } from "next/server";

// Helper para validar e converter ID
function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

/**
 * GET /api/cursos/:id/listas/:listaId
 * Busca uma lista de exercícios com suas questões completas
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; listaId: string }> }
) {
  try {
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const { listaId } = await params;
    const db = await getDb();

    const listaOid = oid(listaId);
    if (!listaOid) return badRequest("ID da lista inválido");

    // Buscar a lista
    const lista = await db.collection("listasDeExercicios").findOne({
      _id: listaOid,
    });

    if (!lista) {
      return notFound("Lista de exercícios não encontrada");
    }

    // Buscar as questões completas
    const questoesIds = (lista.questoesIds || []).map((id: any) => 
      typeof id === 'string' ? oid(id) : id
    ).filter(Boolean);

    let questoes: any[] = [];
    if (questoesIds.length > 0) {
      const questoesFromDb = await db.collection("questoes")
        .find({ _id: { $in: questoesIds } })
        .toArray();

      // Popular imagemIds com os dados completos dos recursos (incluindo URLs)
      const recursosCol = db.collection("recursos");

      // Reorganizar questões na ordem da lista, adicionar pontuação e popular imagens
      questoes = await Promise.all(questoesIds.map(async qId => {
        const questao = questoesFromDb.find(q => q._id.equals(qId));
        if (!questao) return null;

        const pontuacao = lista.questoesPontuacao?.[qId.toString()] || 0;
        
        // Popular imagemIds com os dados completos dos recursos
        let imagens: any[] = [];
        // Tentar buscar recursos de ambos os campos: imagemIds e recursos
        const imagemIdsArray = questao.imagemIds || questao.recursos || [];
        
        if (Array.isArray(imagemIdsArray) && imagemIdsArray.length > 0) {
          try {
            // Converter recursos para ObjectIds se necessário
            const recursoIds = imagemIdsArray.map((rid: any) => 
              typeof rid === 'string' ? oid(rid) : rid
            ).filter(Boolean);

            if (recursoIds.length > 0) {
              const recursos = await recursosCol.find({ 
                _id: { $in: recursoIds }
              }).toArray();
              
              imagens = recursos.map((rec: any) => ({
                id: rec._id?.toString(),
                url: rec.url,
                filename: rec.filename,
                mime: rec.mime
              }));
            }
          } catch (err) {
            console.error('[GET lista] Erro ao buscar recursos:', err);
          }
        }
        
        // Serializar ObjectIds e adicionar campos extras
        const { _id, ownerId, createdBy, updatedBy, cursoIds, imagemIds, recursos, ...rest } = questao;
        
        return {
          id: _id?.toString(),
          ownerId: ownerId?.toString(),
          createdBy: createdBy?.toString(),
          updatedBy: updatedBy?.toString(),
          cursoIds: Array.isArray(cursoIds) ? cursoIds.map((id: any) => id?.toString()) : [],
          imagemIds: Array.isArray(imagemIds) ? imagemIds.map((id: any) => id?.toString()) : [],
          recursos: Array.isArray(recursos) ? recursos.map((id: any) => id?.toString()) : [],
          imagens, // Adicionar array de imagens populado
          pontuacao,
          ...rest,
        };
      }));

      // Filtrar nulls
      questoes = questoes.filter(Boolean);
    }

    // Serializar a lista
    const listaSerializada = {
      ...lista,
      _id: lista._id.toString(),
      questoesIds: (lista.questoesIds || []).map((id: any) => id.toString()),
      questoes,
    };

    return json(listaSerializada);
  } catch (e) {
    console.error("Erro ao buscar lista:", e);
    return serverError(e);
  }
}

/**
 * @swagger
 * /api/cursos/{id}/listas/{listaId}:
 * delete:
 * summary: Exclui uma lista de exercícios
 * tags: [Listas de Exercícios]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: ID do curso (não usado na lógica, mas parte da rota)
 * schema:
 * type: string
 * - in: path
 * name: listaId
 * required: true
 * description: ID da lista de exercícios a ser excluída
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Lista excluída com sucesso
 * 400:
 * description: ID da lista inválido
 * 404:
 * description: Lista não encontrada
 * 500:
 * description: Erro no servidor
 */

// Atualiza uma lista de exercícios existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; listaId: string }> }
) {
  try {
    const { id: cursoId, listaId } = await params;
    const cursoOid = oid(cursoId);
    const listaOid = oid(listaId);

    if (!cursoOid || !listaOid) return badRequest("IDs inválidos");

    const body = await request.json();
    const {
      tituloLista,
      nomeInstituicao,
      questoesIds, // Array de IDs
      usarPontuacao,
      questoesPontuacao,
    } = body;

    if (!tituloLista) {
      return badRequest("Nome da matéria é obrigatório");
    }

    const db = await getDb();

    // Verificar se a lista existe e pertence ao curso
    const listaExistente = await db.collection("listasDeExercicios").findOne({
      _id: listaOid,
      cursoId: cursoId,
    });

    if (!listaExistente) return notFound("Lista de exercícios não encontrada");

    // Atualizar a lista
    const updateData: any = {
      tituloLista,
      nomeInstituicao: nomeInstituicao || "",
      questoesIds: Array.isArray(questoesIds) ? questoesIds : [], // Garante que é um array
      usarPontuacao: usarPontuacao || false,
      atualizadoEm: new Date(),
    };

    // Adicionar ou remover pontuações
    if (usarPontuacao && questoesPontuacao) {
      updateData.questoesPontuacao = questoesPontuacao;
    } else {
      // Se não estiver usando pontuação, remover o campo
      updateData.questoesPontuacao = {};
    }

    await db.collection("listasDeExercicios").updateOne(
      { _id: listaOid },
      { $set: updateData }
    );

    const listaAtualizada = await db.collection("listasDeExercicios").findOne({ _id: listaOid });

    return json({
      message: "Lista atualizada com sucesso",
      lista: {
        ...listaAtualizada,
        id: listaAtualizada?._id.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar lista:", error);
    return serverError("Erro ao atualizar lista");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, listaId: string }> }) {
  try {
    const { listaId } = await params;
    const _id = oid(listaId);

    if (!_id) return badRequest("ID da lista inválido");

    const db = await getDb();
    const result = await db.collection("listasDeExercicios").deleteOne({ _id });

    if (!result.deletedCount) return notFound("Lista de exercícios não encontrada");

    return json({ ok: true, message: 'Lista de exercícios excluída com sucesso!' });
  } catch (e) {
    return serverError(e);
  }
}