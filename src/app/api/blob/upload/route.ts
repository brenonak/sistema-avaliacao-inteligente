import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
 
import { upsertRecurso } from "../../../../lib/resources";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";

export const runtime = "nodejs";

/**
 * POST /api/blob/upload
 * Faz upload de arquivo para Vercel Blob (requer autenticação)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[POST /api/blob/upload] Iniciando upload...');
    
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) {
      console.log('[POST /api/blob/upload] Usuário não autenticado');
      return userIdOrError;
    }
    const userId = userIdOrError;
    console.log('[POST /api/blob/upload] userId:', userId);

    // Ensure the server has the required Blob token configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[POST /api/blob/upload] BLOB_READ_WRITE_TOKEN is not set in the environment");
      return NextResponse.json(
        { error: "Server is missing BLOB_READ_WRITE_TOKEN" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('[POST /api/blob/upload] Body recebido:', Object.keys(body));
    console.log('[POST /api/blob/upload] Token configurado:', !!process.env.BLOB_READ_WRITE_TOKEN);

    // Capturar userId no closure para uso nos callbacks
    const userIdForCallbacks = userId;

    console.log('[POST /api/blob/upload] Chamando handleUpload...');
    
    const jsonResponse = await handleUpload({
      body: body as HandleUploadBody,
      request,
      onBeforeGenerateToken: async (pathname: string, clientPayload: string | null) => {
        console.log('[onBeforeGenerateToken] pathname:', pathname);
        console.log('[onBeforeGenerateToken] clientPayload:', clientPayload);
        // Parse client payload to get original filename
        let originalFilename = pathname;
        let timestamp = Date.now();
        
        if (clientPayload) {
          try {
            const payload = JSON.parse(clientPayload);
            originalFilename = payload.originalFilename || pathname;
            timestamp = payload.timestamp || Date.now();
          } catch (error) {
            console.warn("Failed to parse client payload:", error);
          }
        }

        const config = {
          allowedContentTypes: [
            "image/jpeg",
            "image/png", 
            "image/webp",
            "image/gif",
            "image/svg+xml"
          ],
          maxSizeBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            originalFilename,
            timestamp,
            userId: userIdForCallbacks // Incluir userId no token payload
          }),
        };
        
        console.log('[onBeforeGenerateToken] Retornando config:', JSON.stringify(config, null, 2));
        return config;
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('[onUploadCompleted] blob.url:', blob.url);
        console.log('[onUploadCompleted] blob.pathname:', blob.pathname);
        try {
          // Parse token payload
          let payload: any = {};
          if (tokenPayload) {
            try {
              payload = JSON.parse(tokenPayload);
            } catch (error) {
              console.warn("Failed to parse token payload:", error);
            }
          }

          // Extract metadata from blob
          const recursoData = {
            provider: "vercel-blob" as const,
            url: blob.url,
            key: blob.pathname,
            filename: payload.originalFilename || 
                     blob.pathname?.split('/').pop() || 
                     'unknown',
            mime: blob.contentType || inferMimeType(blob.pathname),
            sizeBytes: 0,
          };

          // Usar userId do payload ou do closure
          const ownerIdForRecurso = payload.userId || userIdForCallbacks;
          await upsertRecurso(recursoData, ownerIdForRecurso);
          
          console.log("Resource registered successfully for user:", ownerIdForRecurso, blob.url);
        } catch (error) {
          console.error("Error registering resource:", error);
        }
      },
    });

    console.log('[POST /api/blob/upload] Upload concluído com sucesso');
    console.log('[POST /api/blob/upload] Response:', JSON.stringify(jsonResponse, null, 2));
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[POST /api/blob/upload] ❌ Upload error:", error);
    console.error("[POST /api/blob/upload] Error stack:", error instanceof Error ? error.stack : 'No stack');
    console.error("[POST /api/blob/upload] Error message:", error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function inferMimeType(pathname?: string): string {
  if (!pathname) return "application/octet-stream";
  
  const extension = pathname.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}