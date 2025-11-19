
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdOrUnauthorized } from '../../../lib/auth-helpers';
import { getDb } from '../../../lib/mongodb';

// Busca todos os cursos do usuário autenticado
async function getCursosDoUsuario(userId: string) {
  const db = await getDb();
  const cursos = await db.collection('cursos')
    .find({ ownerId: typeof userId === 'string' ? new (await import('mongodb')).ObjectId(userId) : userId })
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

  // 2. Buscar todos os cursos do usuário
  const cursos = await getCursosDoUsuario(userId);

  // 3. Buscar provas e listas de exercícios para cada curso
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

  // TODO: Buscar correções do aluno logado e montar dados dos gráficos

  return NextResponse.json({ cursos, provasPorCurso, listasPorCurso });
}
