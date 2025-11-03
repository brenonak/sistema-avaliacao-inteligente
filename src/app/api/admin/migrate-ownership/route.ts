/**
 * POST /api/admin/migrate-ownership
 * Migra a propriedade de todos os recursos de um usuário para outro
 * 
 * ATENÇÃO: Esta é uma rota administrativa, usar com cuidado!
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromUserId, toUserId } = body;

    if (!fromUserId || !toUserId) {
      return NextResponse.json(
        { error: "fromUserId e toUserId são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar ObjectIds
    let fromId: ObjectId, toId: ObjectId;
    try {
      fromId = new ObjectId(fromUserId);
      toId = new ObjectId(toUserId);
    } catch (e) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Migrar cursos
    const cursosResult = await db.collection("cursos").updateMany(
      { ownerId: fromId },
      { 
        $set: { 
          ownerId: toId,
          updatedAt: new Date(),
          updatedBy: toId
        } 
      }
    );

    // Migrar questões
    const questoesResult = await db.collection("questoes").updateMany(
      { ownerId: fromId },
      { 
        $set: { 
          ownerId: toId,
          updatedAt: new Date(),
          updatedBy: toId
        } 
      }
    );

    // Migrar imagens
    const imagensResult = await db.collection("imagens").updateMany(
      { ownerId: fromId },
      { 
        $set: { 
          ownerId: toId,
          updatedAt: new Date(),
          updatedBy: toId
        } 
      }
    );

    // Migrar recursos
    const recursosResult = await db.collection("recursos").updateMany(
      { ownerId: fromId },
      { 
        $set: { 
          ownerId: toId,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: "Migração de ownership concluída",
      results: {
        cursos: cursosResult.modifiedCount,
        questoes: questoesResult.modifiedCount,
        imagens: imagensResult.modifiedCount,
        recursos: recursosResult.modifiedCount,
      },
      migrationInfo: {
        from: fromUserId,
        to: toUserId,
        performedBy: session.user.email,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Erro na migração de ownership:", error);
    return NextResponse.json(
      { error: "Falha na migração", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
