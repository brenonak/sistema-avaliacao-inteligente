import { NextResponse } from "next/server";
import { clientPromise } from "../../../../../lib/mongodb"; 
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../auth"; 
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cursoId } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Buscar o curso para obter o array de alunosIds
    const curso = await db.collection("cursos").findOne({
      _id: new ObjectId(cursoId),
    });

    if (!curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    // Se não tem alunos matriculados, retornar array vazio
    if (!curso.alunosIds || curso.alunosIds.length === 0) {
      return NextResponse.json({ 
        items: [],
        total: 0
      });
    }

    // Buscar os dados dos alunos
    const alunos = await db.collection("users")
      .find({
        _id: { $in: curso.alunosIds }
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
        isProfileComplete: 1,
        pontuacao: 1
      })
      .toArray();

    const formattedAlunos = alunos.map(aluno => ({
      ...aluno,
      _id: aluno._id.toString(),
      nome: aluno.name || "Sem Nome",
    }));

    // 5. Retorno mantendo o contrato { items: [] }
    return NextResponse.json({ 
      items: formattedAlunos,
      total: formattedAlunos.length
    });

  } catch (error) {
    console.error("[API] Erro ao listar alunos:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar alunos do curso." },
      { status: 500 }
    );
  }
}