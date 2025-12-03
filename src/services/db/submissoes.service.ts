import { ObjectId } from "mongodb";
import { getDb } from "../../lib/mongodb";

export interface RespostaSubmissao {
  questaoId: ObjectId;
  resposta: any;
  pontuacaoObtida: number;
  pontuacaoMaxima: number;
  isCorrect: boolean;
  corrigidoEm: Date;
}

export interface Submissao {
  _id?: ObjectId;
  alunoId: ObjectId;
  referenciaId: ObjectId; // ID da Prova ou Lista
  tipo: "PROVA" | "LISTA";
  status: "EM_ANDAMENTO" | "FINALIZADO";
  dataInicio: Date;
  dataFim?: Date;
  notaTotal: number;
  respostas: RespostaSubmissao[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Busca uma submissão ativa ou finalizada
 */
export async function getSubmissao(
  alunoId: string,
  referenciaId: string
): Promise<Submissao | null> {
  const db = await getDb();
  const collection = db.collection<Submissao>("submissoes");

  return collection.findOne({
    alunoId: new ObjectId(alunoId),
    referenciaId: new ObjectId(referenciaId),
  });
}

/**
 * Inicia uma nova submissão se não existir
 */
export async function iniciarSubmissao(
  alunoId: string,
  referenciaId: string,
  tipo: "PROVA" | "LISTA"
): Promise<Submissao> {
  const db = await getDb();
  const collection = db.collection<Submissao>("submissoes");
  const alunoObjectId = new ObjectId(alunoId);
  const refObjectId = new ObjectId(referenciaId);

  const existing = await collection.findOne({
    alunoId: alunoObjectId,
    referenciaId: refObjectId,
  });

  if (existing) {
    return existing;
  }

  const novaSubmissao: Submissao = {
    alunoId: alunoObjectId,
    referenciaId: refObjectId,
    tipo,
    status: "EM_ANDAMENTO",
    dataInicio: new Date(),
    notaTotal: 0,
    respostas: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(novaSubmissao);
  return { ...novaSubmissao, _id: result.insertedId };
}

/**
 * Registra uma resposta dentro de uma submissão
 */
export async function registrarResposta(
  alunoId: string,
  referenciaId: string,
  tipo: "PROVA" | "LISTA",
  resposta: RespostaSubmissao
): Promise<void> {
  const db = await getDb();
  const collection = db.collection<Submissao>("submissoes");
  const alunoObjectId = new ObjectId(alunoId);
  const refObjectId = new ObjectId(referenciaId);

  // Garante que a submissão existe
  await iniciarSubmissao(alunoId, referenciaId, tipo);

  // Remove resposta anterior para a mesma questão (se houver) e adiciona a nova
  await collection.updateOne(
    {
      alunoId: alunoObjectId,
      referenciaId: refObjectId,
    },
    {
      $pull: { respostas: { questaoId: new ObjectId(resposta.questaoId) } } as any,
      $set: { updatedAt: new Date() },
    }
  );

  await collection.updateOne(
    {
      alunoId: alunoObjectId,
      referenciaId: refObjectId,
    },
    {
      $push: { respostas: resposta },
      $set: { updatedAt: new Date() },
    }
  );

  // Recalcula nota total
  await recalcularNotaTotal(alunoId, referenciaId);
}

/**
 * Finaliza uma submissão
 */
export async function finalizarSubmissao(
  alunoId: string,
  referenciaId: string
): Promise<void> {
  const db = await getDb();
  const collection = db.collection<Submissao>("submissoes");

  await recalcularNotaTotal(alunoId, referenciaId);

  await collection.updateOne(
    {
      alunoId: new ObjectId(alunoId),
      referenciaId: new ObjectId(referenciaId),
    },
    {
      $set: {
        status: "FINALIZADO",
        dataFim: new Date(),
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Recalcula a nota total da submissão somando as pontuações obtidas
 */
async function recalcularNotaTotal(
  alunoId: string,
  referenciaId: string
): Promise<void> {
  const db = await getDb();
  const collection = db.collection<Submissao>("submissoes");

  const submissao = await collection.findOne({
    alunoId: new ObjectId(alunoId),
    referenciaId: new ObjectId(referenciaId),
  });

  if (!submissao) return;

  const total = submissao.respostas.reduce(
    (acc, curr) => acc + (curr.pontuacaoObtida || 0),
    0
  );

  await collection.updateOne(
    { _id: submissao._id },
    { $set: { notaTotal: total } }
  );
}

/**
 * Lista submissões de um aluno
 */
export async function listSubmissoesAluno(alunoId: string) {
  const db = await getDb();
  const collection = db.collection<Submissao>("submissoes");

  return collection
    .find({ alunoId: new ObjectId(alunoId) })
    .sort({ updatedAt: -1 })
    .toArray();
}
