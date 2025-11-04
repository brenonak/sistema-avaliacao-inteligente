/**
 * Serviço de acesso a dados para Recursos/Imagens
 * 
 * NOTA: Este service é um wrapper sobre lib/resources.ts
 * A coleção "recursos" é gerenciada centralmente por lib/resources.ts
 * 
 * Regras:
 * - Todas as operações SEMPRE escopam por ownerId (isolamento por usuário)
 * - Create: injeta ownerId do userId
 * - Read/List: filtra por { ownerId: userId }
 * - Delete: filtro inclui { _id, ownerId: userId }
 */

import { ObjectId } from "mongodb";
import { getDb } from "../../lib/mongodb";
import { Recurso, getRecursosCollection } from "../../lib/resources";

// Tipo alias para compatibilidade com código existente
export type Imagem = Recurso;

export interface CreateImagemInput {
  url: string;
  filename?: string;
  nome?: string;
  descricao?: string;
  tipo?: string;
  mime?: string;
  tamanho?: number;
  sizeBytes?: number;
}

/**
 * Cria um novo recurso/imagem na coleção "recursos"
 * @param userId - ID do usuário autenticado (será o owner)
 * @param data - Dados da imagem (ownerId será injetado)
 * @returns Recurso criado
 */
export async function createImagem(
  userId: string,
  data: CreateImagemInput
): Promise<Recurso> {
  const collection = await getRecursosCollection();

  const userObjectId = new ObjectId(userId);
  const now = new Date();

  const recurso: Recurso = {
    provider: "vercel-blob",
    url: data.url,
    filename: data.filename || data.nome || "unknown",
    mime: data.mime || data.tipo || "application/octet-stream",
    sizeBytes: data.sizeBytes || data.tamanho || 0,
    key: data.url.split("/").pop() || "",
    ownerId: userObjectId,
    usage: { refCount: 0 },
    createdAt: now,
    updatedAt: now,
    status: "active",
  };

  const result = await collection.insertOne(recurso);

  return {
    ...recurso,
    _id: result.insertedId,
  };
}

/**
 * Lista todos os recursos/imagens do usuário
 * @param userId - ID do usuário autenticado
 * @returns Array de recursos do usuário
 */
export async function listImagens(userId: string): Promise<Recurso[]> {
  const collection = await getRecursosCollection();

  const recursos = await collection
    .find({ ownerId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();

  return recursos;
}

/**
 * Busca um recurso/imagem por ID (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param imagemId - ID da imagem
 * @returns Recurso encontrado ou null
 */
export async function getImagemById(
  userId: string,
  imagemId: string
): Promise<Recurso | null> {
  const collection = await getRecursosCollection();

  const recurso = await collection.findOne({
    _id: new ObjectId(imagemId),
    ownerId: new ObjectId(userId),
  });

  return recurso;
}

/**
 * Deleta um recurso/imagem (apenas se pertencer ao usuário)
 * NOTA: Verifica se não está sendo usado antes de deletar
 * @param userId - ID do usuário autenticado
 * @param imagemId - ID da imagem
 * @returns true se deletou, false se não encontrou
 */
export async function deleteImagem(
  userId: string,
  imagemId: string
): Promise<boolean> {
  const collection = await getRecursosCollection();

  // Verificar se o recurso existe e pertence ao usuário
  const recurso = await collection.findOne({
    _id: new ObjectId(imagemId),
    ownerId: new ObjectId(userId),
  });

  if (!recurso) {
    return false;
  }

  // Verificar se está sendo usado (refCount > 0)
  if (recurso.usage && recurso.usage.refCount > 0) {
    throw new Error(`Recurso está sendo usado por ${recurso.usage.refCount} questão(ões)`);
  }

  const result = await collection.deleteOne({
    _id: new ObjectId(imagemId),
    ownerId: new ObjectId(userId),
  });

  return result.deletedCount > 0;
}

/**
 * Verifica se um recurso/imagem pertence ao usuário
 * @param userId - ID do usuário autenticado
 * @param imagemId - ID da imagem
 * @returns true se pertence, false caso contrário
 */
export async function checkImagemOwnership(
  userId: string,
  imagemId: string
): Promise<boolean> {
  const recurso = await getImagemById(userId, imagemId);
  return recurso !== null;
}

/**
 * Busca recursos por array de IDs (apenas os que pertencem ao usuário)
 * @param userId - ID do usuário autenticado
 * @param imagemIds - Array de IDs de imagens
 * @returns Array de recursos encontrados
 */
export async function getImagensByIds(
  userId: string,
  imagemIds: string[]
): Promise<Recurso[]> {
  if (!imagemIds || imagemIds.length === 0) return [];

  const collection = await getRecursosCollection();

  const objectIds = imagemIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const recursos = await collection
    .find({
      _id: { $in: objectIds },
      ownerId: new ObjectId(userId),
    })
    .toArray();

  return recursos;
}
