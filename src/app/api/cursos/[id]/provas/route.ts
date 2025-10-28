import { getDb } from "../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../lib/http";
import { ObjectId } from "mongodb";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const _id = oid(id);
    if (!_id) return badRequest("id inválido");
    
    const body = await request.json();
    const { titulo, instrucoes, nomeEscola, disciplina, professor, data, duracao, valorTotal, observacoes } = body;
    
    if (!titulo || !instrucoes) {
      return badRequest("Título e instruções são obrigatórios");
    }
    
    const db = await getDb();
    
    // Verificar se o curso existe
    const curso = await db.collection("cursos").findOne({ _id });
    if (!curso) return notFound("curso não encontrado");
    
    // Criar documento da prova
    const prova = {
      cursoId: id,
      titulo,
      instrucoes,
      nomeEscola: nomeEscola || '',
      disciplina: disciplina || '',
      professor: professor || '',
      data: data || '',
      duracao: duracao || '',
      valorTotal: valorTotal || '',
      observacoes: observacoes || '',
      criadoEm: new Date(),
    };
    
    const result = await db.collection("provas").insertOne(prova);
    
    return json({ 
      id: result.insertedId.toString(),
      message: 'Prova criada com sucesso!',
      ...prova
    });
  } catch (e) {
    return serverError(e);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const db = await getDb();
    const provas = await db.collection("provas")
      .find({ cursoId: id })
      .sort({ criadoEm: -1 })
      .toArray();
    
    const provasFormatadas = provas.map(({ _id, ...rest }) => ({
      id: _id?.toString?.() ?? _id,
      ...rest
    }));
    
    return json({ items: provasFormatadas });
  } catch (e) {
    return serverError(e);
  }
}
