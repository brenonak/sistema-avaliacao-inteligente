import { put, list, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { upsertRecurso, getRecursosCollection, getTopRecursos } from "../../../lib/resources"
import { getDb } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserIdOrUnauthorized } from "../../../lib/auth-helpers"

/**
 * GET /api/galeria
 * Lista todas as imagens/recursos do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    console.log('[GET /api/galeria] Listando recursos para userId:', userId);

    // Buscar todos os recursos do usuário (ordenados por uso)
    const recursos = await getTopRecursos(userId, 200); // Limite alto para galeria

    console.log('[GET /api/galeria] Recursos encontrados:', recursos.length);

    // Mapear para o formato esperado pela galeria
    const images = recursos.map((recurso) => ({
      id: recurso._id?.toString(),
      url: recurso.url,
      pathname: recurso.key || recurso.filename,
      uploadedAt: recurso.createdAt?.toISOString(),
      size: recurso.sizeBytes,
      tipo: recurso.mime,
      filename: recurso.filename,
      refCount: recurso.usage?.refCount || 0,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error("[GET /api/galeria] Error listing images:", error);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}

/**
 * POST /api/galeria
 * Faz upload de uma imagem para o usuário autenticado
 */
export async function POST(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    console.log('[POST /api/galeria] Upload iniciado para:', file.name);

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('[POST /api/galeria] Upload concluído:', blob.url);

    // Registrar em recursos (única fonte de verdade)
    const recurso = await upsertRecurso({
      provider: "vercel-blob",
      url: blob.url,
      key: blob.pathname,
      filename: file.name,
      mime: file.type,
      sizeBytes: file.size,
    }, userId);

    console.log('[POST /api/galeria] Recurso registrado:', recurso._id);

    return NextResponse.json({
      id: recurso._id?.toString(),
      url: recurso.url,
      pathname: recurso.key,
      uploadedAt: recurso.createdAt?.toISOString(),
      size: recurso.sizeBytes,
      filename: recurso.filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/galeria
 * Remove uma imagem (apenas se pertencer ao usuário)
 * NOTA: Questões que referenciam a imagem NÃO são deletadas automaticamente
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { url, id } = body;

    console.log('[DELETE /api/galeria] Deletando recurso:', { url, id, userId });

    // Buscar recurso por ID ou URL
    const collection = await getRecursosCollection();
    let recurso;
    
    if (id) {
      recurso = await collection.findOne({
        _id: new ObjectId(id),
        ownerId: new ObjectId(userId),
      });
    } else if (url) {
      recurso = await collection.findOne({
        url: url,
        ownerId: new ObjectId(userId),
      });
    }

    if (!recurso) {
      return NextResponse.json({ error: "Image not found or access denied" }, { status: 404 });
    }

    const recursoId = recurso._id.toString();

    // Verificar se há questões usando esta imagem
    const db = await getDb();
    const questoesCollection = db.collection("questoes");
    
    const questoesUsandoImagem = await questoesCollection.countDocuments({
      ownerId: new ObjectId(userId),
      imagemIds: new ObjectId(recursoId),
    });

    console.log('[DELETE /api/galeria] Questões usando imagem:', questoesUsandoImagem);

    if (questoesUsandoImagem > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete image: ${questoesUsandoImagem} question(s) are using it`,
          questionsCount: questoesUsandoImagem 
        },
        { status: 400 }
      );
    }

    // Deletar recurso do banco
    const deleteResult = await collection.deleteOne({
      _id: new ObjectId(recursoId),
      ownerId: new ObjectId(userId),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }

    console.log('[DELETE /api/galeria] Recurso deletado do MongoDB');

    // Deletar o arquivo do Blob Storage
    try {
      await del(recurso.url);
      console.log('[DELETE /api/galeria] Arquivo deletado do Blob Storage');
    } catch (blobError) {
      console.error("[DELETE /api/galeria] Failed to delete from blob storage:", blobError);
      // Mesmo que falhe ao deletar do blob, o registro já foi removido do banco
    }

    return NextResponse.json({ 
      success: true,
    });
  } catch (error) {
    console.error("Delete operation failed:", error);
    return NextResponse.json(
      { error: "Failed to delete resource", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}