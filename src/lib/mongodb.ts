import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;
if (!uri) throw new Error("Defina MONGODB_URI");
if (!dbName) throw new Error("Defina MONGODB_DB");

let client: MongoClient;
let db: Db;
let clientPromise: Promise<MongoClient>;

declare global {
  // permite HMR em dev sem recriar cliente
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  if (!db) {
    const c = await clientPromise;
    db = c.db(dbName);
  }
  return db;
}

// Export clientPromise para uso com MongoDBAdapter do Next-Auth
export { clientPromise };