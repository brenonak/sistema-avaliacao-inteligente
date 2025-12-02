
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdOrUnauthorized } from '../../../lib/auth-helpers';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Busca todos os cursos do usuário autenticado
async function getCursosDoUsuario(userId: string) {
  const db = await getDb();
  const cursos = await db.collection('cursos')
    .find({ ownerId: typeof userId === 'string' ? new ObjectId(userId) : userId })
    .sort({ createdAt: -1 })
    .toArray();
  return cursos.map(curso => ({
    id: curso._id?.toString(),
    nome: curso.nome,
    descricao: curso.descricao,
    slug: curso.slug,
  }));
}

export async function GET(req: NextRequest) {
  // 1. Autenticação
  const userIdOrError = await getUserIdOrUnauthorized();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  // 2. Buscar todos os cursos do usuário (Professor)
  const cursos = await getCursosDoUsuario(userId);

  // 3. Buscar provas e listas de exercícios para cada curso (Professor)
  const db = await getDb();
  const provasPorCurso: Record<string, any[]> = {};
  const listasPorCurso: Record<string, any[]> = {};

  for (const curso of cursos) {
    // Provas
    const provas = await db.collection('provas')
      .find({ cursoId: curso.id })
      .sort({ data: 1 })
      .toArray();
    provasPorCurso[curso.id] = provas.map(p => ({
      id: p._id?.toString(),
      titulo: p.titulo,
      data: p.data,
      valorTotal: p.valorTotal,
    }));

    // Listas de Exercícios
    const listas = await db.collection('listasDeExercicios')
      .find({ cursoId: curso.id })
      .sort({ criadoEm: 1 })
      .toArray();
    listasPorCurso[curso.id] = listas.map(l => ({
      id: l._id?.toString(),
      nomeMateria: l.nomeMateria,
      criadoEm: l.criadoEm,
    }));
  }

  // 4. Calcular estatísticas do aluno (Aluno)
  const userObjectId = new ObjectId(userId);

  const pipeline = [
    { $match: { ownerId: userObjectId } },
    {
      $group: {
        _id: "$listaId",
        totalObtido: { $sum: "$pontuacaoObtida" },
        totalMaximo: { $sum: "$pontuacaoMaxima" },
        data: { $max: "$createdAt" }
      }
    },
    {
      $project: {
        nota: {
          $cond: [
            { $eq: ["$totalMaximo", 0] },
            0,
            { $multiply: [{ $divide: ["$totalObtido", "$totalMaximo"] }, 10] }
          ]
        },
        data: 1
      }
    },
    // Filtrar para considerar apenas PROVAS no cálculo de desempenho
    {
      $lookup: {
        from: "provas",
        localField: "_id",
        foreignField: "_id",
        as: "isProva"
      }
    },
    { $match: { "isProva.0": { $exists: true } } },
    { $sort: { data: 1 } }, // Ordenar por data crescente para o histórico
    {
      $group: {
        _id: null,
        mediaGeral: { $avg: "$nota" },
        melhorNota: { $max: "$nota" },
        ultimaAvaliacao: { $last: "$nota" }, // Última nota baseada na ordenação por data
        historico: { $push: { nota: "$nota", data: "$data" } }
      }
    }
  ];

  const statsResult = await db.collection('respostasAluno').aggregate(pipeline).toArray();
  
  const studentStats = statsResult.length > 0 ? statsResult[0] : {
    mediaGeral: 0,
    melhorNota: 0,
    ultimaAvaliacao: 0,
    historico: []
  };

  return NextResponse.json({ 
    cursos, 
    provasPorCurso, 
    listasPorCurso,
    studentStats 
  });
}