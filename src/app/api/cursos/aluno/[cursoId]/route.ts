import { NextRequest, NextResponse } from "next/server";
import { getUserIdOrUnauthorized } from "../../../../../lib/auth-helpers";
import { json, notFound, serverError } from "../../../../../lib/http";
import { getDb } from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/cursos/aluno/[cursoId]
 * Busca dados de um curso específico para o aluno autenticado
 * Retorna: curso, provas (com notas do aluno) e listas de exercícios (com notas/status)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cursoId: string }> }
) {
    try {
        const { cursoId } = await params;

        // Validar sessão e obter userId (aluno)
        const userIdOrError = await getUserIdOrUnauthorized();
        if (userIdOrError instanceof NextResponse) return userIdOrError;
        const userId = userIdOrError;

        console.log('[GET /api/cursos/aluno/[cursoId]] userId:', userId, 'cursoId:', cursoId);

        const db = await getDb();
        const cursoObjectId = new ObjectId(cursoId);
        const userObjectId = new ObjectId(userId);

        // 1. Buscar curso e verificar se o aluno está matriculado
        const curso = await db.collection("cursos").findOne({
            _id: cursoObjectId,
            alunosIds: userObjectId, // Verificar se aluno está matriculado
        });

        if (!curso) {
            return notFound("Curso não encontrado ou aluno não está matriculado");
        }

        // 2. Buscar provas do curso
        const provas = await db.collection("provas")
            .find({ cursoId })
            .toArray();

        // 3. Para cada prova, buscar a nota do aluno (se existir)
        const provasComNotas = await Promise.all(
            provas.map(async (prova) => {
                // Buscar respostas do aluno para esta prova
                const respostas = await db.collection("respostasAluno")
                    .find({
                        listaId: prova._id,
                        ownerId: userObjectId,
                    })
                    .toArray();

                // Calcular nota total da prova
                let pontuacaoObtida = 0;
                let pontuacaoTotal = 0;
                let finalizada = false;

                respostas.forEach((resposta: any) => {
                    pontuacaoObtida += resposta.pontuacaoObtida || 0;
                    pontuacaoTotal += resposta.pontuacaoMaxima || 0;
                    if (resposta.finalizado) finalizada = true;
                });

                // Calcular nota (0-10) se houver pontuação máxima
                let nota: number | null = null;
                if (pontuacaoTotal > 0) {
                    nota = (pontuacaoObtida / pontuacaoTotal) * 10;
                }

                // Se não houver respostas/pontuacaoTotal, retornar pontuacaoObtida como null
                const pontuacaoObtidaOrNull = pontuacaoTotal > 0 ? pontuacaoObtida : null;
                const pontuacaoTotalOrNull = pontuacaoTotal > 0 ? pontuacaoTotal : null;

                return {
                    id: prova._id.toString(),
                    titulo: prova.titulo,
                    instrucoes: prova.instrucoes || "",
                    nomeEscola: prova.nomeEscola || "",
                    disciplina: prova.disciplina || "",
                    professor: prova.professor || "",
                    data: prova.data || "",
                    duracao: prova.duracao || "",
                    nota: nota, // null se não respondida, 0-10 se respondida
                    pontuacaoObtida: pontuacaoObtidaOrNull, // null se não respondida
                    pontuacaoTotal: pontuacaoTotalOrNull, // null se não há pontos
                    finalizada: finalizada,
                    dataFinalizacao: respostas[0]?.dataFinalizacao || null,
                };
            })
        );

        // 4. Buscar listas de exercícios do curso
        const listas = await db.collection("listasDeExercicios")
            .find({ cursoId })
            .toArray();

        // 5. Para cada lista, buscar a nota/status do aluno
        const listasComNotas = await Promise.all(
            listas.map(async (lista) => {
                // Buscar respostas do aluno para esta lista
                const respostas = await db.collection("respostasAluno")
                    .find({
                        listaId: lista._id,
                        ownerId: userObjectId,
                    })
                    .toArray();

                // Calcular nota total da lista
                let pontuacaoObtida = 0;
                let pontuacaoTotal = 0;
                let finalizada = false;

                respostas.forEach((resposta: any) => {
                    pontuacaoObtida += resposta.pontuacaoObtida || 0;
                    pontuacaoTotal += resposta.pontuacaoMaxima || 0;
                    if (resposta.finalizado) finalizada = true;
                });

                // Calcular nota (0-10) se houver pontuação máxima
                let nota: number | null = null;
                if (pontuacaoTotal > 0) {
                    nota = (pontuacaoObtida / pontuacaoTotal) * 10;
                }

                const pontuacaoObtidaOrNullL = pontuacaoTotal > 0 ? pontuacaoObtida : null;
                const pontuacaoTotalOrNullL = pontuacaoTotal > 0 ? pontuacaoTotal : null;

                return {
                    id: lista._id.toString(),
                    tituloLista: lista.tituloLista || "Lista",
                    nomeInstituicao: lista.nomeInstituicao || "",
                    nota: nota, // null se não respondida, 0-10 se respondida
                    pontuacaoObtida: pontuacaoObtidaOrNullL,
                    pontuacaoTotal: pontuacaoTotalOrNullL,
                    finalizada: finalizada,
                    dataFinalizacao: respostas[0]?.dataFinalizacao || null,
                };
            })
        );

        // 6. Montar resposta final
        return json({
            curso: {
                id: curso._id.toString(),
                nome: curso.nome,
                codigo: curso.codigo,
                descricao: curso.descricao || "",
            },
            provas: provasComNotas,
            listas: listasComNotas,
        });
    } catch (e) {
        console.error('[GET /api/cursos/aluno/[cursoId]] Erro:', e);
        return serverError(e);
    }
}
