import { getDb } from "../../../lib/mongodb";
import { json, badRequest, serverError } from "../../../lib/http";
import { CursoCreateSchema } from "../../../lib/validation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const cursos = await db.collection("cursos").find({}).toArray();
    // Para cada curso, contar questões associadas
    const questoesCounts = await db.collection("questoes").aggregate([
      { $unwind: "$cursoIds" },
      { $group: { _id: "$cursoIds", count: { $sum: 1 } } }
    ]).toArray();
    const countsMap = Object.fromEntries(questoesCounts.map(q => [q._id, q.count]));
    const itens = cursos.map(({ _id, ...rest }) => ({
      id: _id.toString(),
      questoesCount: countsMap[_id.toString()] || 0,
      ...rest,
    }));
    return json({ itens });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CursoCreateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos");
    const db = await getDb();
    const exists = await db.collection("cursos").findOne({ nome: parsed.data.nome });
    if (exists) return badRequest("Já existe um curso com este nome");
    const doc = { ...parsed.data, criadoEm: new Date(), atualizadoEm: new Date() };
    const res = await db.collection("cursos").insertOne(doc);
    return json({ id: res.insertedId.toString(), ...doc }, 201);
  } catch (e) {
    return serverError(e);
  }
}
