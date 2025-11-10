/**
 * API Route para verificar se o perfil do usuário está completo
 * Usado pelo middleware para verificação em Edge Runtime
 */

import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Validar userId
    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Validar que é uma requisição do middleware
    const isMiddlewareRequest = request.headers.get("x-middleware-request") === "true";
    
    if (!isMiddlewareRequest) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Validar formato do ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "userId inválido" },
        { status: 400 }
      );
    }

    // Conectar ao MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    // Buscar usuário
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    await client.close();

    // Retornar resultado
    return NextResponse.json({
      profileCompleted: user?.profileCompleted === true,
      userId,
    });
  } catch (error) {
    console.error("[API /profile/check] Erro:", error);
    return NextResponse.json(
      { 
        error: "Erro ao verificar perfil",
        profileCompleted: true, // Fallback para não bloquear usuário
      },
      { status: 500 }
    );
  }
}
