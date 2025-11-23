import { NextResponse } from "next/server";
import { clientPromise } from "../../../../../lib/mongodb"; 
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../auth"; 
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cursoId = params.id;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 2. Definição do Filtro
    // Baseado na sua imagem, o usuário tem o campo 'curso' e 'role'/'papel'
    // Estamos buscando:
    // - Usuários onde 'curso' bate com o ID da URL
    // - E que NÃO sejam professores (assumindo que você quer apenas alunos)
    const query = {
      curso: cursoId, 
      
      $or: [
        { role: "ALUNO" }, 
        { role: "STUDENT" },
        { papel: "aluno" },
        { papel: "estudante" },
        // Fallback: Se o campo role for nulo, assumimos que é aluno (já que profs tem role definida)
        { role: null }, 
        { role: { $exists: false } } 
      ]
    };

    // 3. Executa a Query com Projeção
    // IMPORTANTE: Nunca retorne o objeto user completo (pode ter senhas, tokens, etc)
    const alunos = await db.collection("users")
      .find(query)
      .project({
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
        isProfileComplete: 1, // Útil para mostrar status na lista
        pontuacao: 1 // Caso você tenha gamificação
      })
      .toArray();

    const formattedAlunos = alunos.map(aluno => ({
      ...aluno,
      _id: aluno._id.toString(),
      nome: aluno.name || "Sem Nome", // Fallback visual
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