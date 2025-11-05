import { NextRequest, NextResponse } from "next/server";
import { getRecursosCollection } from "../../../../lib/resources";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { updateResourceRefCount } from "../../../../lib/resource-utils";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL da imagem é obrigatória" },
        { status: 400 }
      );
    }

    const collection = await getRecursosCollection();
    const recurso = await collection.findOne({ url: imageUrl });

    if (!recurso) {
      return NextResponse.json(
        { error: "Imagem não encontrada" },
        { status: 404 }
      );
    }

    // Buscar questões que usam esta imagem
    const db = await getDb();
    const questoesCollection = db.collection("questoes");
    // Atualiza o contador de referências
    const refCount = await updateResourceRefCount(recurso._id.toString());
    
    const questoes = await questoesCollection
      .find({ recursos: recurso._id.toString() })
      .toArray();

    return NextResponse.json({
      hasQuestions: refCount > 0,
      questionCount: refCount,
      questions: questoes.map(q => ({
        id: q._id.toString(),
        title: q.enunciado || "Sem título"
      }))
    });
  } catch (error) {
    console.error("Error checking image relations:", error);
    return NextResponse.json(
      { error: "Erro ao verificar relações da imagem" },
      { status: 500 }
    );
  }
}