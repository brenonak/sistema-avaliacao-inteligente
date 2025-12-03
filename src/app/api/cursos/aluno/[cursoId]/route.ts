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
        // Otimização: Buscar todas as submissões de uma vez
        const provaIds = provas.map(p => p._id);
        const submissoesProvas = await db.collection("submissoes")
            .find({
                alunoId: userObjectId,
                referenciaId: { $in: provaIds },
                tipo: "PROVA"
            })
            .toArray();

        const submissoesProvasMap = new Map(submissoesProvas.map(s => [s.referenciaId.toString(), s]));

        const provasComNotas = provas.map((prova) => {
            const submissao = submissoesProvasMap.get(prova._id.toString());
            
            let pontuacaoObtida: number | null = null;
            let nota: number | null = null;
            let finalizada = false;
            let dataFinalizacao: Date | null = null;

            if (submissao) {
                pontuacaoObtida = submissao.notaTotal;
                finalizada = submissao.status === "FINALIZADO";
                dataFinalizacao = submissao.dataFim || null;

                // Calcular nota 0-10 se houver valorTotal na prova
                if (prova.valorTotal && prova.valorTotal > 0 && pontuacaoObtida !== null) {
                    nota = (pontuacaoObtida / prova.valorTotal) * 10;
                } else if (pontuacaoObtida !== null) {
                    // Fallback: se não tiver valorTotal, usa a pontuação obtida como nota ou tenta calcular
                    // Se quisermos manter compatibilidade com lógica antiga de somar pontuação das questões,
                    // teríamos que buscar as questões. Por enquanto, vamos assumir que notaTotal é o que importa.
                    nota = pontuacaoObtida; 
                }
            }

            return {
                id: prova._id.toString(),
                titulo: prova.titulo,
                instrucoes: prova.instrucoes || "",
                nomeEscola: prova.nomeEscola || "",
                disciplina: prova.disciplina || "",
                professor: prova.professor || "",
                data: prova.data || "",
                duracao: prova.duracao || "",
                nota: nota,
                pontuacaoObtida: pontuacaoObtida,
                pontuacaoTotal: prova.valorTotal || null,
                finalizada: finalizada,
                dataFinalizacao: dataFinalizacao,
            };
        });

        // 4. Buscar listas de exercícios do curso
        const listas = await db.collection("listasDeExercicios")
            .find({ cursoId })
            .toArray();

        // 5. Para cada lista, buscar a nota/status do aluno
        const listaIds = listas.map(l => l._id);
        const submissoesListas = await db.collection("submissoes")
            .find({
                alunoId: userObjectId,
                referenciaId: { $in: listaIds },
                tipo: "LISTA"
            })
            .toArray();

        const submissoesListasMap = new Map(submissoesListas.map(s => [s.referenciaId.toString(), s]));

        const listasComNotas = listas.map((lista) => {
            const submissao = submissoesListasMap.get(lista._id.toString());

            let pontuacaoObtida: number | null = null;
            let nota: number | null = null;
            let finalizada = false;
            let dataFinalizacao: Date | null = null;

            if (submissao) {
                pontuacaoObtida = submissao.notaTotal;
                finalizada = submissao.status === "FINALIZADO";
                dataFinalizacao = submissao.dataFim || null;
                
                // Listas geralmente não têm "valorTotal" explícito no objeto lista, 
                // então usamos a pontuação obtida como referência principal.
                nota = pontuacaoObtida;
            }

            return {
                id: lista._id.toString(),
                tituloLista: lista.tituloLista || "Lista",
                nomeInstituicao: lista.nomeInstituicao || "",
                nota: nota,
                pontuacaoObtida: pontuacaoObtida,
                pontuacaoTotal: null, // Difícil calcular sem buscar todas as questões
                finalizada: finalizada,
                dataFinalizacao: dataFinalizacao,
            };
        });

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
