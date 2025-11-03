/**
 * Serviço de acesso a dados para Imagens/Galeria
 * 
 * Regras:
 * - Todas as operações SEMPRE escopam por ownerId (isolamento por usuário)
 * - Create: injeta ownerId do userId
 * - Read/List: filtra por { ownerId: userId }
 * - Delete: filtro inclui { _id, ownerId: userId }
 */

import { ObjectId } from "mongodb";
import { getDb } from "../../lib/mongodb";

export interface Imagem {
  _id?: ObjectId;
  url: string;
  nome?: string;
  descricao?: string;
  tipo?: string;
  tamanho?: number;
  ownerId: ObjectId;
  createdBy?: ObjectId;
  createdAt?: Date;
}

export interface CreateImagemInput {
  url: string;
  nome?: string;
  descricao?: string;
  tipo?: string;
  tamanho?: number;
}

/**
 * Cria uma nova imagem
 * @param userId - ID do usuário autenticado (será o owner)
 * @param data - Dados da imagem (ownerId será injetado)
 * @returns Imagem criada
 */
export async function createImagem(
  userId: string,
  data: CreateImagemInput
): Promise<Imagem> {
  const db = await getDb();
  const collection = db.collection<Imagem>("imagens");

  const userObjectId = new ObjectId(userId);
  const now = new Date();

  const imagem: Imagem = {
    ...data,
    ownerId: userObjectId,
    createdBy: userObjectId,
    createdAt: now,
  };

  const result = await collection.insertOne(imagem);

  return {
    ...imagem,
    _id: result.insertedId,
  };
}

/**
 * Lista todas as imagens do usuário
 * @param userId - ID do usuário autenticado
 * @returns Array de imagens do usuário
 */
export async function listImagens(userId: string): Promise<Imagem[]> {
  const db = await getDb();
  const collection = db.collection<Imagem>("imagens");

  const imagens = await collection
    .find({ ownerId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();

  return imagens;
}

/**
 * Busca uma imagem por ID (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param imagemId - ID da imagem
 * @returns Imagem encontrada ou null
 */
export async function getImagemById(
  userId: string,
  imagemId: string
): Promise<Imagem | null> {
  const db = await getDb();
  const collection = db.collection<Imagem>("imagens");

  const imagem = await collection.findOne({
    _id: new ObjectId(imagemId),
    ownerId: new ObjectId(userId),
  });

  return imagem;
}

/**
 * Deleta uma imagem (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param imagemId - ID da imagem
 * @returns true se deletou, false se não encontrou
 */
export async function deleteImagem(
  userId: string,
  imagemId: string
): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<Imagem>("imagens");

  const result = await collection.deleteOne({
    _id: new ObjectId(imagemId),
    ownerId: new ObjectId(userId),
  });

  return result.deletedCount > 0;
}

/**
 * Verifica se uma imagem pertence ao usuário
 * @param userId - ID do usuário autenticado
 * @param imagemId - ID da imagem
 * @returns true se pertence, false caso contrário
 */
export async function checkImagemOwnership(
  userId: string,
  imagemId: string
): Promise<boolean> {
  const imagem = await getImagemById(userId, imagemId);
  return imagem !== null;
}
