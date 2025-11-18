/**
 * Serviço de acesso a dados para Respostas de Alunos
 * * Regras:
 * - Esta coleção armazena a resposta submetida por um aluno para uma questão específica.
 * - O 'ownerId' aqui é o ID do ALUNO que está submetendo a resposta.
 * - Todas as operações SEMPRE escopam por ownerId (isolamento por aluno).
 * - Create: injeta ownerId do userId (aluno).
 * - Read/List: filtra por { ownerId: userId }.
 * - Update/Delete: filtro inclui { _id, ownerId: userId }.
 * - Validação: A 'questaoId' referenciada deve existir.
 */

import { ObjectId } from "mongodb";
import { getDb } from "../../lib/mongodb"; // Ajuste o caminho se necessário

/**
 * Representa a resposta de um aluno a uma questão.
 */
export interface RespostaAluno {
  _id?: ObjectId;
  listaId: ObjectId;   // Referência à lista de exercícios
  questaoId: ObjectId; // Referência à questão respondida
  ownerId: ObjectId;   // ID do aluno que respondeu
  
  /**
   * A resposta real enviada pelo aluno.
   * Pode ser de qualquer tipo dependendo da questão:
   * - Múltipla Escolha: "C"
   * - Discursiva: "O texto da resposta..."
   * - Numérica: 1822
   * - V/F: [true, false, true]
   */
  resposta: any;
  
  pontuacaoMaxima: number; // Pontuação total que a questão valia
  pontuacaoObtida: number; // Pontuação que o aluno alcançou
  isCorrect: boolean;      // A resposta foi 100% correta?
  
  finalizado?: boolean;    // Se true, a resposta foi finalizada e não pode ser modificada
  dataFinalizacao?: Date;  // Data em que a resposta foi finalizada
  
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Dados necessários para criar (registrar) uma nova resposta.
 * A lógica de correção (pontuacaoObtida, isCorrect) é feita
 * ANTES de chamar o create.
 */
export interface CreateRespostaAlunoInput {
  listaId: string;
  questaoId: string;
  resposta: any;
  pontuacaoMaxima: number;
  pontuacaoObtida: number;
  isCorrect: boolean;
  finalizado?: boolean;
}

/**
 * Dados para atualizar uma resposta (ex: re-submissão ou re-correção)
 */
export interface UpdateRespostaAlunoInput {
  resposta?: any;
  pontuacaoMaxima?: number;
  pontuacaoObtida?: number;
  isCorrect?: boolean;
}

/**
 * Valida que a questão referenciada existe
 */
async function validateQuestaoExists(questaoId: string): Promise<void> {
  if (!questaoId) throw new Error("questaoId é obrigatório");

  const db = await getDb();
  const collection = db.collection("questoes");
  
  const questao = await collection.findOne(
    { _id: new ObjectId(questaoId) },
    { projection: { _id: 1 } } 
  );

  if (!questao) {
    throw new Error(
      "A questão referenciada não foi encontrada."
    );
  }
}

/**
 * Cria (registra) uma nova resposta de aluno
 * @param userId - ID do aluno autenticado (será o owner)
 * @param data - Dados da resposta (já corrigida)
 * @returns RespostaAluno criada
 */
export async function createRespostaAluno(
  userId: string,
  data: CreateRespostaAlunoInput
): Promise<RespostaAluno> {
  await validateQuestaoExists(data.questaoId);

  const db = await getDb();
  const collection = db.collection<RespostaAluno>("respostasAluno");

  const userObjectId = new ObjectId(userId);
  const now = new Date();

  const respostaAluno: RespostaAluno = {
    ...data,
    listaId: new ObjectId(data.listaId),
    questaoId: new ObjectId(data.questaoId),
    ownerId: userObjectId, 
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(respostaAluno);

  return {
    ...respostaAluno,
    _id: result.insertedId,
  };
}

/**
 * Lista todas as respostas de um aluno
 * @param userId - ID do aluno autenticado
 * @param listaId - (Opcional) Filtrar respostas para uma lista específica
 * @param questaoId - (Opcional) Filtrar respostas para uma questão específica
 * @returns Array de respostas do aluno
 */
export async function listRespostasAluno(
  userId: string,
  listaId?: string,
  questaoId?: string
): Promise<RespostaAluno[]> {
  const db = await getDb();
  const collection = db.collection<RespostaAluno>("respostasAluno");

  const query: any = {
    ownerId: new ObjectId(userId),
  };
  
  if (listaId) {
    query.listaId = new ObjectId(listaId);
  }
  
  if (questaoId) {
    query.questaoId = new ObjectId(questaoId);
  }

  const respostas = await collection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return respostas;
}

/**
 * Busca uma resposta específica por ID (apenas se pertencer ao aluno)
 * @param userId - ID do aluno autenticado
 * @param respostaId - ID da resposta
 * @returns RespostaAluno encontrada ou null
 */
export async function getRespostaAlunoById(
  userId: string,
  respostaId: string
): Promise<RespostaAluno | null> {
  const db = await getDb();
  const collection = db.collection<RespostaAluno>("respostasAluno");

  const resposta = await collection.findOne({
    _id: new ObjectId(respostaId),
    ownerId: new ObjectId(userId), // Garantir que o aluno só veja a sua
  });

  return resposta;
}

/**
 * Atualiza uma resposta (ex: aluno resubmeteu)
 * @param userId - ID do aluno autenticado
 * @param respostaId - ID da resposta
 * @param data - Dados para atualizar (já corrigidos)
 * @returns RespostaAluno atualizada ou null se não encontrada
 */
export async function updateRespostaAluno(
  userId: string,
  respostaId: string,
  data: UpdateRespostaAlunoInput
): Promise<RespostaAluno | null> {
  const db = await getDb();
  const collection = db.collection<RespostaAluno>("respostasAluno");

  const userObjectId = new ObjectId(userId);

  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(respostaId),
      ownerId: userObjectId, // Só pode atualizar a própria resposta
    },
    {
      $set: {
        ...data,
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
 * Cria ou atualiza uma resposta de aluno (upsert)
 * Se já existir uma resposta do aluno para esta questão, atualiza. Caso contrário, cria nova.
 * @param userId - ID do aluno autenticado
 * @param data - Dados da resposta (já corrigida)
 * @returns RespostaAluno criada ou atualizada
 */
export async function upsertRespostaAluno(
  userId: string,
  data: CreateRespostaAlunoInput
): Promise<RespostaAluno> {
  await validateQuestaoExists(data.questaoId);

  const db = await getDb();
  const collection = db.collection<RespostaAluno>("respostasAluno");

  const userObjectId = new ObjectId(userId);
  const listaObjectId = new ObjectId(data.listaId);
  const questaoObjectId = new ObjectId(data.questaoId);
  const now = new Date();

  // Buscar resposta existente (agora considerando listaId)
  const existingResposta = await collection.findOne({
    ownerId: userObjectId,
    listaId: listaObjectId,
    questaoId: questaoObjectId,
  });

  if (existingResposta) {
    // Atualizar resposta existente
    const updateData: any = {
      resposta: data.resposta,
      pontuacaoMaxima: data.pontuacaoMaxima,
      pontuacaoObtida: data.pontuacaoObtida,
      isCorrect: data.isCorrect,
      updatedAt: now,
    };
    
    // Se finalizado = true, adiciona flag e data
    if (data.finalizado) {
      updateData.finalizado = true;
      updateData.dataFinalizacao = now;
    }

    await collection.updateOne(
      { _id: existingResposta._id },
      { $set: updateData }
    );

    return {
      ...existingResposta,
      ...updateData,
    };
  } else {
    // Criar nova resposta
    const respostaAluno: any = {
      ...data,
      listaId: listaObjectId,
      questaoId: questaoObjectId,
      ownerId: userObjectId,
      createdAt: now,
      updatedAt: now,
    };
    
    // Se finalizado = true, adiciona flag e data
    if (data.finalizado) {
      respostaAluno.finalizado = true;
      respostaAluno.dataFinalizacao = now;
    }

    const result = await collection.insertOne(respostaAluno);

    return {
      ...respostaAluno,
      _id: result.insertedId,
    };
  }
}

/**
 * Deleta uma resposta
 * @param userId - ID do aluno autenticado
 * @param respostaId - ID da resposta
 * @returns true se deletou, false se não encontrou
 */
export async function deleteRespostaAluno(
  userId: string,
  respostaId: string
): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<RespostaAluno>("respostasAluno");

  const result = await collection.deleteOne({
    _id: new ObjectId(respostaId),
    ownerId: new ObjectId(userId), // Só pode deletar a própria resposta
  });

  return result.deletedCount > 0;
}