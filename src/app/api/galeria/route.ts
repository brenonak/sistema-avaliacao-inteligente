import { put, list, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { upsertRecurso, getRecursosCollection } from "../../../lib/resources"
import { getDb } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserIdOrUnauthorized } from "../../../lib/auth-helpers"
import * as ImagensService from "../../../services/db/imagens.service"

/**
 * GET /api/galeria
 * Lista todas as imagens do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Listar imagens do usuário
    const imagens = await ImagensService.listImagens(userId);

    // Mapear para o formato esperado pela galeria
    const images = imagens.map((imagem) => ({
      id: imagem._id?.toString(),
      url: imagem.url,
      pathname: imagem.nome || "",
      uploadedAt: imagem.createdAt?.toISOString(),
      size: imagem.tamanho,
      tipo: imagem.tipo,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error listing images:", error);
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

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    });

    // Criar imagem no banco (vinculada ao usuário)
    const imagem = await ImagensService.createImagem(userId, {
      url: blob.url,
      nome: file.name,
      tipo: file.type,
      tamanho: file.size,
    });

    // Também registrar em recursos para manter compatibilidade
    await upsertRecurso({
      provider: "vercel-blob",
      url: blob.url,
      key: blob.pathname,
      filename: file.name,
      mime: file.type,
      sizeBytes: file.size,
    });

    return NextResponse.json({
      id: imagem._id?.toString(),
      url: imagem.url,
      pathname: imagem.nome,
      uploadedAt: imagem.createdAt?.toISOString(),
      size: imagem.tamanho,
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

    // Buscar imagem por ID ou URL
    let imagem;
    if (id) {
      imagem = await ImagensService.getImagemById(userId, id);
    } else if (url) {
      // Buscar todas as imagens do usuário e encontrar por URL
      const imagens = await ImagensService.listImagens(userId);
      imagem = imagens.find((img) => img.url === url);
    }

    if (!imagem) {
      return NextResponse.json({ error: "Image not found or access denied" }, { status: 404 });
    }

    const imagemId = imagem._id?.toString()!;

    // Verificar se há questões usando esta imagem
    const db = await getDb();
    const questoesCollection = db.collection("questoes");
    
    const questoesUsandoImagem = await questoesCollection.countDocuments({
      ownerId: new ObjectId(userId),
      imagemIds: new ObjectId(imagemId),
    });

    if (questoesUsandoImagem > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete image: ${questoesUsandoImagem} question(s) are using it`,
          questionsCount: questoesUsandoImagem 
        },
        { status: 400 }
      );
    }

    // Deletar imagem do banco (apenas se pertencer ao usuário)
    const deleted = await ImagensService.deleteImagem(userId, imagemId);

    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }

    // Deletar o arquivo do Blob Storage
    try {
      await del(imagem.url);
    } catch (blobError) {
      console.error("Failed to delete from blob storage:", blobError);
      // Mesmo que falhe ao deletar do blob, o registro já foi removido do banco
    }

    // Também deletar de recursos (para manter compatibilidade)
    try {
      const collection = await getRecursosCollection();
      await collection.deleteOne({ url: imagem.url });
    } catch (e) {
      console.error("Failed to delete from recursos:", e);
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