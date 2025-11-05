import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { upsertRecurso } from "../../../../lib/resources";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";

export const runtime = "nodejs";

/**
 * POST /api/blob/upload-direct
 * Upload direto pelo servidor (mais confiável que client upload)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[POST /api/blob/upload-direct] Iniciando upload direto...');
    
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) {
      console.log('[POST /api/blob/upload-direct] Usuário não autenticado');
      return userIdOrError;
    }
    const userId = userIdOrError;
    console.log('[POST /api/blob/upload-direct] userId:', userId);

    // Verificar token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[POST /api/blob/upload-direct] BLOB_READ_WRITE_TOKEN não configurado");
      return NextResponse.json(
        { error: "Server is missing BLOB_READ_WRITE_TOKEN" },
        { status: 500 }
      );
    }

    // Obter arquivo do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo fornecido" },
        { status: 400 }
      );
    }

    console.log('[POST /api/blob/upload-direct] Arquivo recebido:', file.name, 'tamanho:', file.size);

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Apenas imagens são permitidas" },
        { status: 400 }
      );
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 10MB" },
        { status: 400 }
      );
    }

    // Fazer upload para Vercel Blob
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    
    console.log('[POST /api/blob/upload-direct] Fazendo upload para Vercel Blob...');
    
    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('[POST /api/blob/upload-direct] Upload concluído:', blob.url);

    // Registrar recurso no MongoDB
    const recursoData = {
      provider: "vercel-blob" as const,
      url: blob.url,
      key: blob.pathname,
      filename: file.name,
      mime: file.type,
      sizeBytes: file.size,
    };

    const recurso = await upsertRecurso(recursoData, userId);
    
    console.log('[POST /api/blob/upload-direct] Recurso registrado:', recurso._id);

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
      resourceId: recurso._id?.toString(),
    });
  } catch (error) {
    console.error("[POST /api/blob/upload-direct] ❌ Erro:", error);
    
    return NextResponse.json(
      { 
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
