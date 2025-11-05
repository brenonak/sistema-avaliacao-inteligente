import { Db, Collection, ObjectId } from "mongodb";
import { getDb } from "./mongodb";

export interface Recurso {
  _id?: ObjectId;
  provider: "vercel-blob";
  url: string;
  key?: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  ownerId: ObjectId; // ID do usuário que fez o upload
  usage: { refCount: number };
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  status?: "active" | "orphan";
}

let recursosCollection: Collection<Recurso> | null = null;

export async function getRecursosCollection(): Promise<Collection<Recurso>> {
  if (!recursosCollection) {
    const db = await getDb();
    recursosCollection = db.collection<Recurso>("recursos");
    
    // Create idempotent indexes
    await createIndexes(recursosCollection);
  }
  
  return recursosCollection;
}

async function createIndexes(collection: Collection<Recurso>): Promise<void> {
  try {
    // Índice único por URL (mesma URL = mesmo recurso)
    // Isso garante que não temos duplicatas de URLs mesmo entre usuários
    try {
      await collection.createIndex(
        { "url": 1 },
        { unique: true, name: "url_unique" }
      );
    } catch (e) {
      console.warn("Warning: Could not create/verify URL index:", e);
    }

    // Índice para queries por usuário (multi-tenant)
    try {
      await collection.createIndex(
        { "ownerId": 1, "createdAt": -1 },
        { name: "ownerId_createdAt" }
      );
    } catch (e) {
      console.warn("Warning: Could not create ownerId index:", e);
    }

    // Índice para queries de recursos mais usados
    try {
      await collection.createIndex(
        { "usage.refCount": -1, "updatedAt": -1 },
        { name: "usage_refCount_updatedAt" }
      );
    } catch (e) {
      console.warn("Warning: Could not create usage index:", e);
    }

    try {
      await collection.createIndex(
        { "createdAt": -1 },
        { name: "createdAt_desc" }
      );
    } catch (e) {
      console.warn("Warning: Could not create createdAt index:", e);
    }
    
    console.log("✅ Essential indexes verified");
  } catch (error) {
    // Log error but don't throw to allow application to continue
    console.error("Warning: Error verifying indexes:", error);
  }
}

export async function upsertRecurso(recursoData: Partial<Recurso>, userId?: string): Promise<Recurso> {
  const collection = await getRecursosCollection();
  const now = new Date();
  
  // Validações
  if (!recursoData.url) {
    throw new Error("URL do recurso é obrigatória");
  }
  
  // Se ownerId não foi fornecido e temos userId, converter para ObjectId
  const ownerId = recursoData.ownerId || (userId ? new ObjectId(userId) : undefined);
  
  if (!ownerId) {
    throw new Error("ownerId ou userId deve ser fornecido para criar recurso");
  }
  
  // Verificar se já existe um recurso com esta URL
  const existingRecurso = await collection.findOne({ url: recursoData.url });
  
  if (existingRecurso) {
    // Se já existe, apenas atualizar o updatedAt
    // Nota: Não alteramos o ownerId de um recurso existente
    const updateResult = await collection.findOneAndUpdate(
      { url: recursoData.url },
      { 
        $set: { 
          updatedAt: now,
          // Atualizar outros campos se fornecidos
          ...(recursoData.filename && { filename: recursoData.filename }),
          ...(recursoData.mime && { mime: recursoData.mime }),
          ...(recursoData.sizeBytes !== undefined && { sizeBytes: recursoData.sizeBytes }),
          ...(recursoData.key && { key: recursoData.key }),
        } 
      },
      { returnDocument: "after" }
    );
    
    if (!updateResult) {
      throw new Error("Failed to update existing recurso");
    }
    
    console.log('[upsertRecurso] Recurso já existe, atualizado:', updateResult._id);
    return updateResult;
  }
  
  // Se não existe, criar novo recurso
  const newRecurso: Recurso = {
    provider: recursoData.provider || "vercel-blob",
    url: recursoData.url,
    key: recursoData.key || "",
    filename: recursoData.filename || "unknown",
    mime: recursoData.mime || "application/octet-stream",
    sizeBytes: recursoData.sizeBytes || 0,
    ownerId,
    usage: { refCount: 0 },
    createdAt: now,
    updatedAt: now,
    status: "active",
  };
  
  const insertResult = await collection.insertOne(newRecurso);
  
  console.log('[upsertRecurso] Novo recurso criado:', insertResult.insertedId);
  
  return {
    ...newRecurso,
    _id: insertResult.insertedId,
  };
}

export async function getTopRecursos(userId: string, limit: number = 10): Promise<Recurso[]> {
  const collection = await getRecursosCollection();
  
  // SEMPRE filtrar por ownerId (multi-tenant)
  // Ordenar por refCount (decrescente) e depois por data de atualização
  return await collection
    .find({ ownerId: new ObjectId(userId) })
    .sort({ "usage.refCount": -1, "updatedAt": -1 })
    .limit(limit)
    .toArray();
}

export async function getRecursoByUrl(url: string): Promise<Recurso | null> {
  const collection = await getRecursosCollection();
  try {
    const recurso = await collection.findOne({ url });
    return recurso ?? null;
  } catch {
    return null;
  }
}

export async function incrementResourceUsage(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const collection = await getRecursosCollection();
  const now = new Date();
  const objectIds = ids
    .map((id) => {
      try { return new ObjectId(id); } catch { return null; }
    })
    .filter((v): v is ObjectId => !!v);
  if (objectIds.length === 0) return;
  await collection.updateMany(
    { _id: { $in: objectIds } },
    { $inc: { "usage.refCount": 1 }, $set: { lastUsedAt: now, updatedAt: now } }
  );
}

export async function decrementResourceUsage(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const collection = await getRecursosCollection();
  const now = new Date();
  const objectIds = ids
    .map((id) => {
      try { return new ObjectId(id); } catch { return null; }
    })
    .filter((v): v is ObjectId => !!v);
  if (objectIds.length === 0) return;
  await collection.updateMany(
    { _id: { $in: objectIds }, "usage.refCount": { $gt: 0 } },
    { 
      $inc: { "usage.refCount": -1 }, 
      $set: { updatedAt: now }
    }
  );
}

export async function getRecursoById(id: string): Promise<Recurso | null> {
  const collection = await getRecursosCollection();
  
  try {
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    return null;
  }
}

export async function deleteRecurso(id: string): Promise<boolean> {
  const collection = await getRecursosCollection();
  
  try {
    const recurso = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!recurso) {
      return false;
    }
    
    if (recurso.usage.refCount > 0) {
      throw new Error("Cannot delete resource that is in use");
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } catch (error) {
    if (error instanceof Error && error.message.includes("in use")) {
      throw error;
    }
    return false;
  }
}
