import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { getRecursosCollection } from "./resources";

/**
 * Atualiza o contador de referências de um recurso
 */
export async function updateResourceRefCount(resourceId: string) {
  const db = await getDb();
  const questoesCollection = db.collection("questoes");
  const recursosCollection = await getRecursosCollection();

  // Conta quantas questões usam este recurso
  const count = await questoesCollection.countDocuments({
    recursos: resourceId
  });

  // Atualiza o contador no documento do recurso
  await recursosCollection.updateOne(
    { _id: new ObjectId(resourceId) },
    {
      $set: {
        "usage.refCount": count,
        updatedAt: new Date()
      }
    }
  );

  return count;
}