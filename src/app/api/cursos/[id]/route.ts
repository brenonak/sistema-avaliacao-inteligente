import { getDb } from "../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../lib/http";
import { CursoUpdateSchema } from "../../../../lib/validation";
import { ObjectId } from "mongodb";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

export async function GET(request: Request, { params }: any) {
  try {
    const _id = oid(params.id); if (!_id) return badRequest("id inválido");
    const db = await getDb();
    const item = await db.collection("cursos").findOne({ _id });
    if (!item) return notFound("curso não encontrado");
    const { _id: mongoId, ...rest } = item;
    return json({ id: mongoId?.toString?.() ?? mongoId, ...rest });
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const _id = oid(id); if (!_id) return badRequest("id inválido");
    const body = await request.json();
    const parsed = CursoUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest("payload inválido");
    const db = await getDb();
    const res = await db.collection("cursos").findOneAndUpdate(
      { _id },
      { $set: { ...parsed.data, atualizadoEm: new Date() } },
      { returnDocument: "after" }
    );
    if (!res) return notFound("curso não encontrado");
    const { _id: mongoId, ...rest } = res;
    return json({ id: mongoId?.toString?.() ?? mongoId, ...rest });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const _id = oid(id); if (!_id) return badRequest("id inválido");
    const db = await getDb();
    // 1. Desreferenciar este curso das questões
    await db.collection("questoes").updateMany(
      { cursoIds: id },
      { $pull: { cursoIds: id as any } }
    );
    // 2. Agora pode deletar o curso
    const res = await db.collection("cursos").deleteOne({ _id });
    if (!res.deletedCount) return notFound("curso não encontrado");
    return json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
