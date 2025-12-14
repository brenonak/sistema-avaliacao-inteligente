import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUserIdOrUnauthorized } from '../../../../../../lib/auth-helpers';
import { badRequest, serverError } from '../../../../../../lib/http';

function oid(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * GET /api/provas/[id]/submissoes/[alunoId]
 * 
 * Retorna submissão específica do aluno com:
 * - Dados do aluno
 * - Dados da prova
 * - Questões completas (com snapshot da prova: enunciado, alternativas, etc)
 * - Respostas do aluno com feedback do professor
 * - Nota total
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; alunoId: string }> }
) {
  try {
    // 1. Validar autenticação
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const professorId = userIdOrError;

    const { id: provaId, alunoId } = await params;
    const provaOid = oid(provaId);
    const alunoOid = oid(alunoId);

    if (!provaOid) return badRequest('ID da prova inválido');
    if (!alunoOid) return badRequest('ID do aluno inválido');

    const db = await getDb();

    // 2. Buscar a prova
    const prova = await db.collection('provas').findOne({ _id: provaOid });
    if (!prova) {
      return NextResponse.json(
        { message: 'Prova não encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar ownership (professor é dono do curso)
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

    // 4. Buscar dados do aluno
    const aluno = await db.collection('users').findOne({ _id: alunoOid });
    if (!aluno) {
      return NextResponse.json(
        { message: 'Aluno não encontrado' },
        { status: 404 }
      );
    }

    // 5. Buscar submissão do aluno
    const submissao = await db.collection('submissoes').findOne({
      alunoId: alunoOid,
      referenciaId: provaOid,
      tipo: 'PROVA',
    });

    if (!submissao) {
      return NextResponse.json(
        { message: 'Submissão não encontrada' },
        { status: 404 }
      );
    }

    // 6. Montar questões com dados da prova (snapshot) + respostas do aluno
    const questoes = (prova.questoes || []).map((questaoSnapshot: any) => {
      const questaoId = questaoSnapshot._id || questaoSnapshot.id;
      const questaoOid = oid(questaoId.toString());
      
      // Encontrar resposta do aluno para esta questão
      const respostaAluno = submissao.respostas?.find((r: any) =>
        questaoOid && r.questaoId.equals(questaoOid)
      );

      // Montar questão com snapshot + resposta
      return {
        id: questaoId.toString(),
        tipo: questaoSnapshot.tipo,
        enunciado: questaoSnapshot.enunciado,
        pontuacao: questaoSnapshot.pontuacao || 0,
        // Campos específicos por tipo (snapshot)
        alternativas: questaoSnapshot.alternativas || [],
        afirmacoes: questaoSnapshot.afirmacoes || [],
        proposicoes: questaoSnapshot.proposicoes || [],
        respostaCorreta: questaoSnapshot.respostaCorreta,
        margemErro: questaoSnapshot.margemErro,
        // Resposta do aluno
        respostaAluno: respostaAluno?.resposta || null,
        pontuacaoObtida: respostaAluno?.pontuacaoObtida || 0,
        isCorrect: respostaAluno?.isCorrect || false,
        feedback: respostaAluno?.feedback || null,
        corrigidoEm: respostaAluno?.corrigidoEm || null,
      };
    });

    // 7. Montar resposta
    return NextResponse.json({
      aluno: {
        id: aluno._id.toString(),
        nome: aluno.name || 'Sem nome',
        email: aluno.email || 'Sem email',
      },
      prova: {
        id: prova._id.toString(),
        titulo: prova.titulo,
        disciplina: prova.disciplina,
        professor: prova.professor,
      },
      submissao: {
        id: submissao._id.toString(),
        status: submissao.status,
        dataInicio: submissao.dataInicio,
        dataFim: submissao.dataFim,
        notaTotal: submissao.notaTotal || 0,
      },
      questoes,
    });
  } catch (error: any) {
    console.error('Erro ao buscar submissão:', error);
    return serverError(error);
  }
}

/**
 * PUT /api/provas/[id]/submissoes/[alunoId]
 * 
 * Atualiza feedback e notas manuais do professor
 * Body esperado:
 * {
 *   "atualizacoes": [
 *     { "questaoId": "...", "feedback": "...", "pontuacaoObtida": 1.5 },
 *     ...
 *   ]
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; alunoId: string }> }
) {
  try {
    // 1. Validar autenticação
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const professorId = userIdOrError;

    const { id: provaId, alunoId } = await params;
    const provaOid = oid(provaId);
    const alunoOid = oid(alunoId);

    if (!provaOid) return badRequest('ID da prova inválido');
    if (!alunoOid) return badRequest('ID do aluno inválido');

    const body = await request.json();
    const { atualizacoes } = body;

    if (!Array.isArray(atualizacoes) || atualizacoes.length === 0) {
      return badRequest('Campo "atualizacoes" deve ser um array não vazio');
    }

    const db = await getDb();

    // 2. Validar ownership
    const prova = await db.collection('provas').findOne({ _id: provaOid });
    if (!prova) {
      return NextResponse.json(
        { message: 'Prova não encontrada' },
        { status: 404 }
      );
    }

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

    // 3. Buscar submissão
    const submissao = await db.collection('submissoes').findOne({
      alunoId: alunoOid,
      referenciaId: provaOid,
      tipo: 'PROVA',
    });

    if (!submissao) {
      return NextResponse.json(
        { message: 'Submissão não encontrada' },
        { status: 404 }
      );
    }

    // 4. Atualizar respostas com feedback e nota manual
    const colecaoSubmissoes = db.collection('submissoes');
    
    for (const atualizacao of atualizacoes) {
      const questaoOid = oid(atualizacao.questaoId);
      if (!questaoOid) continue;

      const updateData: any = {};

      // Preparar campos de atualização
      if (atualizacao.feedback !== undefined) {
        updateData['respostas.$[elem].feedback'] = atualizacao.feedback;
      }

      if (atualizacao.pontuacaoObtida !== undefined) {
        const pontuacao = Math.max(0, Math.min(
          atualizacao.pontuacaoObtida,
          // Limitar ao máximo da questão
          submissao.respostas?.find((r: any) => r.questaoId.equals(questaoOid))?.pontuacaoMaxima || 0
        ));
        updateData['respostas.$[elem].pontuacaoObtida'] = pontuacao;
      }

      if (Object.keys(updateData).length === 0) continue;

      updateData['respostas.$[elem].corrigidoEm'] = new Date();
      updateData['updatedAt'] = new Date();

      // Executar update
      await colecaoSubmissoes.updateOne(
        { _id: submissao._id },
        { $set: updateData },
        {
          arrayFilters: [
            { 'elem.questaoId': questaoOid },
          ],
        }
      );
    }

    // 5. Recalcular nota total
    const submissaoAtualizada = await colecaoSubmissoes.findOne({
      _id: submissao._id,
    });

    const notaTotal = (submissaoAtualizada?.respostas || []).reduce(
      (acc: number, r: any) => acc + (r.pontuacaoObtida || 0),
      0
    );

    await colecaoSubmissoes.updateOne(
      { _id: submissao._id },
      { $set: { notaTotal, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Submissão atualizada com sucesso',
      notaTotal,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar submissão:', error);
    return serverError(error);
  }
}
