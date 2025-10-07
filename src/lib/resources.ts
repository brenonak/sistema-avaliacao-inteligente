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
    // Index for top resources query (usage.refCount DESC, updatedAt DESC)
    await collection.createIndex(
      { "usage.refCount": -1, "updatedAt": -1 },
      { name: "usage_refCount_updatedAt" }
    );
    
    // Index for chronological listing (createdAt DESC)
    await collection.createIndex(
      { "createdAt": -1 },
      { name: "createdAt_desc" }
    );
    
    // Unique index to prevent duplicate URLs
    await collection.createIndex(
      { "url": 1 },
      { unique: true, name: "url_unique" }
    );
    
    // Index for provider + key (alternative unique constraint)
    await collection.createIndex(
      { "provider": 1, "key": 1 },
      { name: "provider_key" }
    );
    
    console.log("✅ Recursos collection indexes created successfully");
  } catch (error) {
    // Index creation is idempotent, so we can safely ignore duplicate key errors
    if (error instanceof Error && error.message.includes("already exists")) {
      console.log("ℹRecursos collection indexes already exist");
    } else {
      console.error("Error creating recursos collection indexes:", error);
      throw error;
    }
  }
}

export async function upsertRecurso(recursoData: Partial<Recurso>): Promise<Recurso> {
  const collection = await getRecursosCollection();
  const now = new Date();
  
  const filter = { url: recursoData.url };
  const update = {
    $set: {
      ...recursoData,
      updatedAt: now,
    },
    $setOnInsert: {
      usage: { refCount: 0 },
      createdAt: now,
      status: "active",
    },
  };
  
  const options = { upsert: true, returnDocument: "after" as const };
  
  const result = await collection.findOneAndUpdate(filter, update as any, options);
  
  if (!result) {
    throw new Error("Failed to upsert recurso");
  }
  
  return result;
}

export async function getTopRecursos(limit: number = 10): Promise<Recurso[]> {
  const collection = await getRecursosCollection();
  
  return await collection
    .find({ status: { $ne: "orphan" } })
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
