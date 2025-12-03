
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

  // Pipeline atualizado para usar a coleção 'submissoes'
  const pipeline = [
    // Filtrar submissões do aluno que sejam PROVAS ou LISTAS e estejam FINALIZADAS
    { 
      $match: { 
        alunoId: userObjectId, 
        status: "FINALIZADO",
        tipo: { $in: ["PROVA", "LISTA"] }
      } 
    },
    // Buscar dados da prova (se for prova)
    {
      $lookup: {
        from: "provas",
        localField: "referenciaId",
        foreignField: "_id",
        as: "prova"
      }
    },
    // Buscar dados da lista (se for lista)
    {
      $lookup: {
        from: "listasDeExercicios",
        localField: "referenciaId",
        foreignField: "_id",
        as: "lista"
      }
    },
    {
      $project: {
        tipo: 1,
        notaTotal: 1,
        dataFim: 1,
        updatedAt: 1,
        prova: { $arrayElemAt: ["$prova", 0] },
        lista: { $arrayElemAt: ["$lista", 0] }
      }
    },
    // Calcular a nota
    {
      $project: {
        nota: {
          $cond: {
            if: { $eq: ["$tipo", "PROVA"] },
            then: {
              $cond: [
                { $gt: ["$prova.valorTotal", 0] },
                { $multiply: [{ $divide: ["$notaTotal", "$prova.valorTotal"] }, 10] },
                "$notaTotal" // Fallback se valorTotal for 0 ou inexistente
              ]
            },
            else: "$notaTotal" // Para LISTA, usa a nota total direta (pontos acumulados)
          }
        },
        data: { $ifNull: ["$dataFim", "$updatedAt"] }
      }
    },
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

  const statsResult = await db.collection('submissoes').aggregate(pipeline).toArray();
  
  const studentStats = statsResult.length > 0 ? statsResult[0] : {
    mediaGeral: 0,
    melhorNota: 0,
    ultimaAvaliacao: 0,
    historico: []
  };

  // 5. Buscar Atividades Pendentes (Provas e Listas não finalizadas)
  // Buscar cursos onde o aluno está matriculado
  const cursosMatriculados = await db.collection('cursos')
    .find({ alunosIds: userObjectId })
    .project({ _id: 1 })
    .toArray();
  
  const cursoIds = cursosMatriculados.map(c => c._id.toString());

  // Buscar todas as atividades desses cursos
  const [provasDisponiveis, listasDisponiveis] = await Promise.all([
    db.collection('provas').find({ cursoId: { $in: cursoIds } }).toArray(),
    db.collection('listasDeExercicios').find({ cursoId: { $in: cursoIds } }).toArray()
  ]);

  // Buscar submissões finalizadas do aluno
  const submissoesFinalizadas = await db.collection('submissoes')
    .find({ 
      alunoId: userObjectId, 
      status: "FINALIZADO" 
    })
    .project({ referenciaId: 1 })
    .toArray();
  
  const finishedIds = new Set(submissoesFinalizadas.map(s => s.referenciaId.toString()));

  const pendingActivities = [];

  // Processar Provas Pendentes
  for (const p of provasDisponiveis) {
    if (!finishedIds.has(p._id.toString())) {
      pendingActivities.push({
        id: p._id.toString(),
        title: p.titulo,
        due: p.data ? `Data: ${new Date(p.data).toLocaleDateString('pt-BR')}` : 'Sem data',
        type: 'PROVA',
        dateObj: p.data ? new Date(p.data) : new Date(8640000000000000)
      });
    }
  }

  // Processar Listas Pendentes
  for (const l of listasDisponiveis) {
    if (!finishedIds.has(l._id.toString())) {
      pendingActivities.push({
        id: l._id.toString(),
        title: l.tituloLista || l.titulo || 'Lista de Exercícios',
        due: 'Disponível',
        type: 'LISTA',
        dateObj: l.criadoEm ? new Date(l.criadoEm) : new Date()
      });
    }
  }

  // Ordenar por data (mais próximas primeiro) e pegar as 5 primeiras
  pendingActivities.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  const topPending = pendingActivities.slice(0, 5);

  return NextResponse.json({ 
    cursos, 
    provasPorCurso, 
    listasPorCurso,
    studentStats,
    pendingActivities: topPending
  });
}