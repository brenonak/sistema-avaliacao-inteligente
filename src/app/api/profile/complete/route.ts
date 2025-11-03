/**
 * POST /api/profile/complete
 * Completa o perfil do usuário após o primeiro login
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";
import { CompleteProfileSchema } from "../../../../lib/validation";

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const body = await request.json();

    // Validar dados com Zod
    const parsed = CompleteProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: "Dados inválidos", 
          details: parsed.error.issues.map(i => i.message).join("; ")
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    // Atualizar o documento do usuário
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name: parsed.data.nome, // Atualiza o nome também
          papel: parsed.data.papel,
          instituicao: parsed.data.instituicao,
          curso: parsed.data.curso,
          areasInteresse: parsed.data.areasInteresse,
          profileCompleted: true,
          profileCompletedAt: new Date(),
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar o usuário atualizado
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    });

    return NextResponse.json({
      success: true,
      message: "Perfil completado com sucesso",
      user: {
        id: user?._id?.toString(),
        name: user?.name,
        email: user?.email,
        papel: user?.papel,
        instituicao: user?.instituicao,
        curso: user?.curso,
        areasInteresse: user?.areasInteresse,
        profileCompleted: user?.profileCompleted,
      }
    });
  } catch (error) {
    console.error("Erro ao completar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao salvar perfil", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/complete
 * Verifica se o perfil do usuário está completo
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const db = await getDb();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profileCompleted: user.profileCompleted || false,
      user: {
        id: user._id?.toString(),
        name: user.name,
        email: user.email,
        papel: user.papel,
        instituicao: user.instituicao,
        curso: user.curso,
        areasInteresse: user.areasInteresse || [],
      }
    });
  } catch (error) {
    console.error("Erro ao verificar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao verificar perfil" },
      { status: 500 }
    );
  }
}
