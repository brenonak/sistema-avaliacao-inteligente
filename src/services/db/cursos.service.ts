/**
 * Serviço de acesso a dados para Cursos
 * 
 * Regras:
 * - Todas as operações SEMPRE escopam por ownerId (isolamento por usuário)
 * - Create: injeta ownerId do userId (ignora qualquer ownerId do cliente)
 * - Read/List: filtra por { ownerId: userId }
 * - Update/Delete: filtro inclui { _id, ownerId: userId } (retorna 404 se não corresponder)
 */

import { ObjectId } from "mongodb";
import { getDb } from "../../lib/mongodb";

export interface Curso {
  _id?: ObjectId;
  nome: string;
  codigo: string;
  slug: string;
  descricao?: string;
  ownerId: ObjectId;
  createdBy?: ObjectId;
  updatedBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCursoInput {
  nome: string;
  codigo: string;
  slug: string;
  descricao?: string;
}

export interface UpdateCursoInput {
  nome?: string;
  codigo?: string;
  slug?: string;
  descricao?: string;
}

/**
 * Cria um novo curso
 * @param userId - ID do usuário autenticado (será o owner)
 * @param data - Dados do curso (ownerId será injetado)
 * @returns Curso criado
 */
export async function createCurso(
  userId: string,
  data: CreateCursoInput
): Promise<Curso> {
  const db = await getDb();
  const collection = db.collection<Curso>("cursos");

  const userObjectId = new ObjectId(userId);
  const now = new Date();

  // Injetar ownerId (nunca confiar no cliente)
  const curso: Curso = {
    ...data,
    ownerId: userObjectId,
    createdBy: userObjectId,
    updatedBy: userObjectId,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(curso);
  
  return {
    ...curso,
    _id: result.insertedId,
  };
}

/**
 * Lista todos os cursos do usuário
 * @param userId - ID do usuário autenticado
 * @returns Array de cursos do usuário
 */
export async function listCursos(userId: string): Promise<Curso[]> {
  const db = await getDb();
  const collection = db.collection<Curso>("cursos");

  // SEMPRE filtrar por ownerId
  const cursos = await collection
    .find({ ownerId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();

  return cursos;
}

/**
 * Busca um curso por ID (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param cursoId - ID do curso
 * @returns Curso encontrado ou null
 */
export async function getCursoById(
  userId: string,
  cursoId: string
): Promise<Curso | null> {
  const db = await getDb();
  const collection = db.collection<Curso>("cursos");

  // Filtro SEMPRE inclui ownerId (não vazar existência de recursos de outros)
  const curso = await collection.findOne({
    _id: new ObjectId(cursoId),
    ownerId: new ObjectId(userId),
  });

  return curso;
}

/**
 * Busca curso por slug (apenas do usuário)
 * @param userId - ID do usuário autenticado
 * @param slug - Slug do curso
 * @returns Curso encontrado ou null
 */
export async function getCursoBySlug(
  userId: string,
  slug: string
): Promise<Curso | null> {
  const db = await getDb();
  const collection = db.collection<Curso>("cursos");

  const curso = await collection.findOne({
    slug,
    ownerId: new ObjectId(userId),
  });

  return curso;
}

/**
 * Atualiza um curso (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param cursoId - ID do curso
 * @param data - Dados para atualizar
 * @returns Curso atualizado ou null se não encontrado/não pertencer ao usuário
 */
export async function updateCurso(
  userId: string,
  cursoId: string,
  data: UpdateCursoInput
): Promise<Curso | null> {
  const db = await getDb();
  const collection = db.collection<Curso>("cursos");

  const userObjectId = new ObjectId(userId);

  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(cursoId),
      ownerId: userObjectId, // Garantir que só atualiza se for do usuário
    },
    {
      $set: {
        ...data,
        updatedBy: userObjectId,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    }
  );

  return result;
}

/**
 * Deleta um curso (apenas se pertencer ao usuário)
 * @param userId - ID do usuário autenticado
 * @param cursoId - ID do curso
 * @returns true se deletou, false se não encontrou/não pertencer ao usuário
 */
export async function deleteCurso(
  userId: string,
  cursoId: string
): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<Curso>("cursos");

  const result = await collection.deleteOne({
    _id: new ObjectId(cursoId),
    ownerId: new ObjectId(userId), // Só deleta se for do usuário
  });

  return result.deletedCount > 0;
}

/**
 * Conta quantas questões cada curso do usuário possui
 * @param userId - ID do usuário autenticado
 * @returns Map de cursoId -> quantidade de questões
 */
export async function getCursosWithQuestionCount(
  userId: string
): Promise<Array<Curso & { questoesCount: number }>> {
  const db = await getDb();
  
  const result = await db.collection("cursos").aggregate([
    // Filtrar apenas cursos do usuário
    { $match: { ownerId: new ObjectId(userId) } },
    
    // Lookup nas questões
    {
      $lookup: {
        from: "questoes",
        let: { cursoId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  // Verificar se cursoIds existe e é um array antes de usar $in
                  { $isArray: "$cursoIds" },
                  { $in: ["$$cursoId", "$cursoIds"] },
                  { $eq: ["$ownerId", new ObjectId(userId)] }, // Só contar questões do usuário
                ],
              },
            },
          },
        ],
        as: "questoes",
      },
    },
    
    // Adicionar campo com contagem
    {
      $addFields: {
        questoesCount: { $size: "$questoes" },
      },
    },
    
    // Remover array de questões (só queremos a contagem)
    {
      $project: {
        questoes: 0,
      },
    },
    
    // Ordenar por contagem decrescente
    { $sort: { questoesCount: -1 } },
  ]).toArray();

  return result as Array<Curso & { questoesCount: number }>;
}
