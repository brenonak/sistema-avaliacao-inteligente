import { getDb } from "../../../lib/mongodb";
import { json, badRequest, serverError } from "../../../lib/http";
import { QuestaoCreateSchema } from "../../../lib/validation";

export const dynamic = "force-dynamic"; // evita cache SSR em dev

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo") || undefined;
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
    const skip = (page - 1) * limit;

    const db = await getDb();
    const filter: any = {};
    if (tipo) filter.tipo = tipo;

    const [items, total] = await Promise.all([
      db.collection("questoes")
        .find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("questoes").countDocuments(filter),
    ]);

    return json({ items, page, limit, total });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = QuestaoCreateSchema.safeParse(body);
    if (!parsed.success) {
        return badRequest(parsed.error.issues.map(i => i.message).join("; "));
    }


    const doc = {
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDb();
    const res = await db.collection("questoes").insertOne(doc);
    return json({ _id: res.insertedId, ...doc }, 201);
  } catch (e) {
    return serverError(e);
  }
}
