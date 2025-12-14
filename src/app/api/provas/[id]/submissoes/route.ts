import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUserIdOrUnauthorized } from '../../../../../lib/auth-helpers';
import { badRequest, serverError } from '../../../../../lib/http';

function oid(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * GET /api/provas/[id]/submissoes
 * 
 * Retorna lista de submissões de uma prova com:
 * - Dados agregados dos alunos (nome, email)
 * - Status de correção (pendente/corrigido)
 * - Nota obtida
 * - Estatísticas gerais (total, corrigidos, pendentes, média)
 * 
 * Validações:
 * - Professor autenticado deve ser o criador do curso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validar autenticação
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const professorId = userIdOrError;

    const { id: provaId } = await params;
    const provaOid = oid(provaId);
    if (!provaOid) return badRequest('ID da prova inválido');

    const db = await getDb();

    // 2. Buscar a prova e validar ownership (via curso)
    const prova = await db.collection('provas').findOne({ _id: provaOid });
    if (!prova) {
      return NextResponse.json(
        { message: 'Prova não encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar que o professor é dono do curso
    const curso = await db.collection('cursos').findOne({
      _id: new ObjectId(prova.cursoId),
      ownerId: new ObjectId(professorId),
    });
    if (!curso) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      );
    }

    // 4. Buscar alunos do curso
    const alunosIds = (curso.alunosIds || []).map((id: any) => new ObjectId(id));
    
    // Buscar dados dos alunos (nome, email)
    const alunos = await db.collection('users')
      .find({ _id: { $in: alunosIds } })
      .toArray();

    const alunosMap = new Map();
    alunos.forEach((aluno: any) => {
      alunosMap.set(aluno._id.toString(), {
        nome: aluno.name || 'Sem nome',
        email: aluno.email || 'Sem email',
      });
    });

    // 5. Buscar submissões da prova
    const submissoes = await db.collection('submissoes')
      .find({
        referenciaId: provaOid,
        tipo: 'PROVA',
      })
      .toArray();

    // 6. Montar resposta com dados agregados
    const submissoesComAluno = alunosIds.map((alunoId: any) => {
      const submissao = submissoes.find((s: any) =>
        s.alunoId.equals(alunoId)
      );
      const alunoData = alunosMap.get(alunoId.toString()) || {
        nome: 'Aluno não encontrado',
        email: '',
      };

      return {
        id: alunoId.toString(),
        nome: alunoData.nome,
        email: alunoData.email,
        status: submissao ? 'corrigido' : 'pendente',
        nota: submissao?.notaTotal || null,
        submissaoId: submissao?._id?.toString() || null,
      };
    });

    // 7. Calcular estatísticas
    const totalAlunos = submissoesComAluno.length;
    const corrigidos = submissoesComAluno.filter(
      (s) => s.status === 'corrigido'
    ).length;
    const pendentes = submissoesComAluno.filter(
      (s) => s.status === 'pendente'
    ).length;

    const notasValidas = submissoesComAluno
      .filter((s) => s.nota !== null)
      .map((s) => s.nota);
    const mediaNotas =
      notasValidas.length > 0
        ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
        : 0;

    // 8. Montar resposta
    return NextResponse.json({
      prova: {
        id: prova._id.toString(),
        titulo: prova.titulo,
        disciplina: prova.disciplina,
        professor: prova.professor,
      },
      submissoes: submissoesComAluno,
      estatisticas: {
        totalAlunos,
        corrigidos,
        pendentes,
        mediaNotas: parseFloat(mediaNotas.toFixed(1)),
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar submissões:', error);
    return serverError(error);
  }
}
