/**
 * Serviço de acesso a dados para Questões
 * 
 * Regras:
 * - Todas as operações SEMPRE escopam por ownerId (isolamento por usuário)
 * - Create: injeta ownerId do userId e valida que todos cursoIds pertencem ao usuário
 * - Read/List: filtra por { ownerId: userId }
 * - Update/Delete: filtro inclui { _id, ownerId: userId }
 * - Validação de consistência: cursos e imagens referenciados devem pertencer ao mesmo owner
 */

import { ObjectId } from "mongodb";
import { getDb } from "../../lib/mongodb";

export interface Questao {
  _id?: ObjectId;
  enunciado: string;
  tipo?: string;
  dificuldade?: string;
  tags?: string[];
  cursoIds?: ObjectId[];
  imagemIds?: ObjectId[];
  // Campos específicos por tipo
  alternativas?: Array<{
    letra?: string;
    texto: string;
    correta: boolean;
  }>;
  gabarito?: string;
  afirmacoes?: Array<{
    texto: string;
    correta: boolean;
  }>;
  proposicoes?: Array<{
    valor: number;
    texto: string;
    correta: boolean;
  }>;
  respostaCorreta?: number;
  margemErro?: number;
  // Metadados
  ownerId: ObjectId;
  createdBy?: ObjectId;
  updatedBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateQuestaoInput {
  enunciado: string;
  tipo?: string;
  dificuldade?: string;
  tags?: string[];
  cursoIds?: string[];
  imagemIds?: string[];
  // Campos específicos por tipo
  alternativas?: Array<{
    letra?: string;
    texto: string;
    correta: boolean;
  }>;
  gabarito?: string;
  afirmacoes?: Array<{
    texto: string;
    correta: boolean;
  }>;
  proposicoes?: Array<{
    valor: number;
    texto: string;
    correta: boolean;
  }>;
  respostaCorreta?: number;
  margemErro?: number;
}

export interface UpdateQuestaoInput {
  enunciado?: string;
  tipo?: string;
  dificuldade?: string;
  tags?: string[];
  cursoIds?: string[];
  imagemIds?: string[];
  // Campos específicos por tipo
  alternativas?: Array<{
    letra?: string;
    texto: string;
    correta: boolean;
  }>;
  gabarito?: string;
  afirmacoes?: Array<{
    texto: string;
    correta: boolean;
  }>;
  proposicoes?: Array<{
    valor: number;
    texto: string;
    correta: boolean;
  }>;
  respostaCorreta?: number;
  margemErro?: number;
}

/**
 * Valida que todos os cursos pertencem ao usuário
 */
async function validateCursoOwnership(
  userId: string,
  cursoIds: string[]
): Promise<void> {
  if (!cursoIds || cursoIds.length === 0) return;

  const db = await getDb();
  const collection = db.collection("cursos");

  const cursoObjectIds = cursoIds.map((id) => new ObjectId(id));
  const userObjectId = new ObjectId(userId);

  // Buscar cursos que pertencem ao usuário
  const cursos = await collection
    .find({
      _id: { $in: cursoObjectIds },
      ownerId: userObjectId,
    })
    .toArray();

  // Se não encontrou todos os cursos, há um owner mismatch
  if (cursos.length !== cursoIds.length) {
    throw new Error(
      "Owner mismatch: um ou mais cursos não pertencem ao usuário"
    );
  }
}

/**
 * Valida que todas as imagens/recursos pertencem ao usuário
 */
async function validateImagemOwnership(
  userId: string,
  imagemIds: string[]
): Promise<void> {
  if (!imagemIds || imagemIds.length === 0) return;

  const db = await getDb();
  // Verificar na collection "recursos" (onde as imagens são armazenadas)
  const collection = db.collection("recursos");

  const imagemObjectIds = imagemIds.map((id) => new ObjectId(id));
  const userObjectId = new ObjectId(userId);

  const recursos = await collection
    .find({
      _id: { $in: imagemObjectIds },
      ownerId: userObjectId,
    })
    .toArray();

  if (recursos.length !== imagemIds.length) {
    const found = recursos.map(r => r._id.toString());
    const missing = imagemIds.filter(id => !found.includes(id));
    console.error(`[validateImagemOwnership] Owner mismatch: recursos não encontrados ou não pertencem ao usuário`, {
      userId,
      requested: imagemIds,
      found: found,
      missing: missing
    });
    throw new Error(
      "Owner mismatch: uma ou mais imagens não pertencem ao usuário"
    );
  }
}

/**
 * Cria uma nova questão
 * @param userId - ID do usuário autenticado (será o owner)
 * @param data - Dados da questão (ownerId será injetado)
 * @returns Questão criada
 */
export async function createQuestao(
  userId: string,
  data: CreateQuestaoInput
): Promise<Questao> {
  // Validar ownership de cursos e imagens
  if (data.cursoIds) {
    await validateCursoOwnership(userId, data.cursoIds);
  }
  if (data.imagemIds) {
    await validateImagemOwnership(userId, data.imagemIds);
  }

  const db = await getDb();
  const collection = db.collection<Questao>("questoes");

  const userObjectId = new ObjectId(userId);
  const now = new Date();

  // Converter IDs de string para ObjectId
  const questao: Questao = {
    ...data,
    cursoIds: data.cursoIds?.map((id) => new ObjectId(id)),
    imagemIds: data.imagemIds?.map((id) => new ObjectId(id)),
    ownerId: userObjectId,
    createdBy: userObjectId,
    updatedBy: userObjectId,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(questao);

  return {
    ...questao,
    _id: result.insertedId,
  };
}

/**
 * Lista todas as questões do usuário
 * @param userId - ID do usuário autenticado
 * @param filters - Filtros opcionais (cursoIds, tags, busca, ordenação, etc)
 * @returns Array de questões do usuário
 */
export async function listQuestoes(
  userId: string,
  filters?: {
    cursoIds?: string[];
    tags?: string[];
    tipo?: string;
    dificuldade?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
): Promise<Questao[]> {
  const db = await getDb();
  const collection = db.collection<Questao>("questoes");

  // Base filter: SEMPRE por ownerId
  const query: any = {
    ownerId: new ObjectId(userId),
  };

  // Adicionar filtros opcionais
  if (filters?.cursoIds && filters.cursoIds.length > 0) {
    query.cursoIds = { $in: filters.cursoIds.map((id) => new ObjectId(id)) };
  }

  if (filters?.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters?.tipo) {
    query.tipo = filters.tipo;
  }

  if (filters?.dificuldade) {
    query.dificuldade = filters.dificuldade;
  }

  // Busca textual no enunciado
  if (filters?.search && filters.search.trim().length > 0) {
    query.enunciado = { 
      $regex: filters.search.trim(), 
      $options: "i" // case-insensitive
    };
  }

  // Definir ordenação
  const sortBy = filters?.sortBy || "createdAt";
  const sortOrder = filters?.sortOrder === "asc" ? 1 : -1;
  
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  const questoes = await collection.find(query).sort(sortOptions).toArray();

  return questoes;
}

/**
 * Busca uma questão por ID (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param questaoId - ID da questão
 * @returns Questão encontrada ou null
 */
export async function getQuestaoById(
  userId: string,
  questaoId: string
): Promise<Questao | null> {
  const db = await getDb();
  const collection = db.collection<Questao>("questoes");

  const questao = await collection.findOne({
    _id: new ObjectId(questaoId),
    ownerId: new ObjectId(userId),
  });

  return questao;
}

/**
 * Atualiza uma questão (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param questaoId - ID da questão
 * @param data - Dados para atualizar
 * @returns Questão atualizada ou null se não encontrado
 */
export async function updateQuestao(
  userId: string,
  questaoId: string,
  data: UpdateQuestaoInput
): Promise<Questao | null> {
  // Validar ownership de cursos e imagens (se fornecidos)
  if (data.cursoIds) {
    await validateCursoOwnership(userId, data.cursoIds);
  }
  if (data.imagemIds) {
    await validateImagemOwnership(userId, data.imagemIds);
  }

  const db = await getDb();
  const collection = db.collection<Questao>("questoes");

  const userObjectId = new ObjectId(userId);

  // Preparar update
  const updateData: any = {
    ...data,
    updatedBy: userObjectId,
    updatedAt: new Date(),
  };

  // Converter IDs se fornecidos
  if (data.cursoIds) {
    updateData.cursoIds = data.cursoIds.map((id) => new ObjectId(id));
  }
  if (data.imagemIds) {
    updateData.imagemIds = data.imagemIds.map((id) => new ObjectId(id));
  }

  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(questaoId),
      ownerId: userObjectId,
    },
    {
      $set: updateData,
    },
    {
      returnDocument: "after",
    }
  );

  return result;
}

/**
 * Deleta uma questão (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param questaoId - ID da questão
 * @returns true se deletou, false se não encontrou
 */
export async function deleteQuestao(
  userId: string,
  questaoId: string
): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<Questao>("questoes");

  const result = await collection.deleteOne({
    _id: new ObjectId(questaoId),
    ownerId: new ObjectId(userId),
  });

  return result.deletedCount > 0;
}

/**
 * Lista tags únicas das questões do usuário
 * @param userId - ID do usuário autenticado
 * @returns Array de tags únicas
 */
export async function getQuestaoTags(userId: string): Promise<string[]> {
  const db = await getDb();
  const collection = db.collection<Questao>("questoes");

  const tags = await collection.distinct("tags", {
    ownerId: new ObjectId(userId),
  });

  return tags as string[];
}
