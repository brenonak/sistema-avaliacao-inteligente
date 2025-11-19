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
  listaId: ObjectId;   // Referência à lista de exercícios ou prova (contexto)
  questaoId: ObjectId; // Referência à questão respondida
  ownerId: ObjectId;   // ID do aluno que respondeu (Target User)

  /**
   * A resposta real enviada pelo aluno.
   */
  resposta: any;

  pontuacaoMaxima: number; // Pontuação total que a questão valia
  pontuacaoObtida: number | null; // Pontuação que o aluno alcançou
  isCorrect: boolean;      // A resposta foi 100% correta?

  finalizado?: boolean;    // Se true, a resposta foi finalizada e não pode ser modificada
  dataFinalizacao?: Date;  // Data em que a resposta foi finalizada

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
  pontuacaoObtida: number | null;
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
 * Cria ou atualiza uma resposta de aluno (upsert)
 * @param ownerId - ID do aluno alvo (Target User)
 * @param data - Dados da resposta (já corrigida)
 * @returns RespostaAluno criada ou atualizada
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
  ownerId: string,
  data: CreateRespostaAlunoInput
): Promise<RespostaAluno> {
  await validateQuestaoExists(data.questaoId);

  const db = await getDb();
  const collection = db.collection<RespostaAluno>("respostasAluno");

  const userObjectId = new ObjectId(ownerId);
  const listaObjectId = new ObjectId(data.listaId);
  const questaoObjectId = new ObjectId(data.questaoId);
  const now = new Date();

  // 1. Chave de busca: ownerId, listaId E questaoId
  const filter = {
    ownerId: userObjectId,
    listaId: listaObjectId,
    questaoId: questaoObjectId,
  };

  // 2. Dados a serem atualizados (UPDATE)
  const updateData: any = {
    resposta: data.resposta,
    pontuacaoMaxima: data.pontuacaoMaxima,
    pontuacaoObtida: data.pontuacaoObtida,
    isCorrect: data.isCorrect,
    updatedAt: now,
  };

  // 3. Lógica de Finalização (Condicional)
  if (data.finalizado) {
    updateData.finalizado = true;
    updateData.dataFinalizacao = now; // Define data de finalização no momento da submissão
  }

  const result = await collection.findOneAndUpdate(
    filter,
    {
      $set: updateData,
      $setOnInsert: { // Define campos apenas na primeira criação (INSERT)
        ownerId: userObjectId,
        listaId: listaObjectId,
        questaoId: questaoObjectId,
        createdAt: now,
      }
    },
    {
      returnDocument: "after",
      upsert: true, //Cria se não existir (atomicidade)
    }
  );

  if (!result) {
    throw new Error("Falha ao criar ou atualizar resposta (Erro atômico inesperado).");
  }

  return result as RespostaAluno;
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



// Tipos definidos
type TipoQuestao = "alternativa" | "afirmacoes" | "numerica" | "proposicoes" | "vf";

interface QuestaoDoc {
  _id: ObjectId;
  tipo: TipoQuestao;
  gabarito: any;       
  pontuacao: number;   
  tolerancia?: number; 
}

interface ResultadoCorrecao {
  isCorrect: boolean;
  pontuacaoObtida: number;
  pontuacaoMaxima: number;
}

/**
 * Helper: Compara dois arrays ignorando a ordem dos elementos.
 * Útil para 'afirmacoes' e 'proposicoes' (Multi-select).
 */
function arraysSaoIguaisSemOrdem(arr1: any[], arr2: any[]): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
}

/**
 * Função pura de correção baseada nos 5 tipos
 */
function calcularCorrecao(questao: QuestaoDoc, respostaAluno: any): ResultadoCorrecao {
  let isCorrect = false;
  const pontuacaoMaxima = questao.pontuacao || 0;

  // Se a resposta for nula ou indefinida, já retorna erro
  if (respostaAluno === null || respostaAluno === undefined) {
    return { isCorrect: false, pontuacaoObtida: 0, pontuacaoMaxima };
  }

  switch (questao.tipo) {
    // 1. Única escolha (Radio Button)
    case "alternativa":
      // Converte para string para evitar erros como "1" (number) !== "1" (string)
      isCorrect = String(questao.gabarito).trim() === String(respostaAluno).trim();
      break;

    // 2. Resposta Numérica (Input Number)
    case "numerica":
      const valorGabarito = Number(questao.gabarito);
      const valorAluno = Number(respostaAluno);
      const margemErro = questao.tolerancia || 0;
      
      // Verifica se é um número válido e se está dentro da margem
      if (!isNaN(valorAluno)) {
        isCorrect = Math.abs(valorGabarito - valorAluno) <= margemErro;
      }
      break;

    // 3. Verdadeiro ou Falso (Array Ordenado)
    case "vf":
      // Ex: Gabarito [true, false, true] deve ser IGUAL e na MESMA ORDEM
      // Assumindo que respostaAluno chega como array de booleans
      isCorrect = JSON.stringify(questao.gabarito) === JSON.stringify(respostaAluno);
      break;

    // 4. Múltiplas Escolhas / Checkbox (Array Sem Ordem)
    case "afirmacoes":
    case "proposicoes":
      // Ex: Gabarito ["A", "C"]. Aluno enviou ["C", "A"]. Deve aceitar.
      // Verifica se são arrays e compara o conteúdo ignorando ordem.
      if (Array.isArray(questao.gabarito) && Array.isArray(respostaAluno)) {
        isCorrect = arraysSaoIguaisSemOrdem(questao.gabarito, respostaAluno);
      } else {
        // Fallback caso proposições seja estilo "Soma" (número inteiro)
        if (typeof questao.gabarito === 'number') {
             isCorrect = Number(questao.gabarito) === Number(respostaAluno);
        } else {
             isCorrect = false;
        }
      }
      break;

    default:
      console.warn(`Tipo de questão desconhecido: ${questao.tipo}`);
      isCorrect = false;
  }

  const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;

  return {
    isCorrect,
    pontuacaoObtida,
    pontuacaoMaxima
  };
}

/**
 * Orquestrador: Busca Questão -> Corrige -> Salva
 */
export async function submeterRespostaAluno(
  userId: string,
  listaId: string,
  questaoId: string,
  respostaAluno: any
): Promise<RespostaAluno> {
  const db = await getDb();
  
  // 1. Busca a questão (projeta gabarito e tipo)
  const questao = await db.collection<QuestaoDoc>("questoes").findOne({ 
    _id: new ObjectId(questaoId) 
  });

  if (!questao) {
    throw new Error("Questão não encontrada.");
  }

  // 2. Executa a correção
  const resultado = calcularCorrecao(questao, respostaAluno);

  // 3. Prepara input para o repositório
  const dadosParaSalvar = {
    listaId,
    questaoId,
    resposta: respostaAluno,
    pontuacaoMaxima: resultado.pontuacaoMaxima,
    pontuacaoObtida: resultado.pontuacaoObtida,
    isCorrect: resultado.isCorrect,
    finalizado: true // Assume que ao enviar, finalizou a tentativa dessa questão
  };

  // 4. Salva no banco
  const respostaSalva = await upsertRespostaAluno(userId, dadosParaSalvar);

  return respostaSalva;
}