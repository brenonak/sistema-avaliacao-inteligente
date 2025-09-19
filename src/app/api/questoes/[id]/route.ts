import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../lib/http";
import { QuestaoUpdateSchema } from "../../../../lib/validation";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const _id = oid(params.id); if (!_id) return badRequest("id inválido");
    const db = await getDb();
    const item = await db.collection("questoes").findOne({ _id });
    if (!item) return notFound("questão não encontrada");
    return json(item);
  } catch (e) { return serverError(e); }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const _id = oid(params.id); if (!_id) return badRequest("id inválido");
    const body = await request.json();
    const parsed = QuestaoUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest("payload inválido");

    const db = await getDb();
    const res = await db.collection("questoes").findOneAndUpdate(
      { _id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!res) return notFound("questão não encontrada");
    return json(res);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const _id = oid(params.id); if (!_id) return badRequest("id inválido");
    const db = await getDb();
    const res = await db.collection("questoes").deleteOne({ _id });
    if (!res.deletedCount) return notFound("questão não encontrada");
    return json({ ok: true });
  } catch (e) { return serverError(e); }
}
