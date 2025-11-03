import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

/**
 * GET /api/blob/test
 * Testa a conexão com Vercel Blob
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/blob/test] Testando conexão com Vercel Blob...');
    console.log('[GET /api/blob/test] Token presente:', !!process.env.BLOB_READ_WRITE_TOKEN);
    console.log('[GET /api/blob/test] Token (primeiros 20 chars):', process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20));

    // Tentar listar blobs
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      limit: 5
    });

    console.log('[GET /api/blob/test] ✅ Conexão bem-sucedida!');
    console.log('[GET /api/blob/test] Número de blobs encontrados:', blobs.length);

    return NextResponse.json({
      success: true,
      message: 'Conexão com Vercel Blob funcionando',
      blobsCount: blobs.length,
      tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN
    });
  } catch (error) {
    console.error('[GET /api/blob/test] ❌ Erro:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN
    }, { status: 500 });
  }
}
