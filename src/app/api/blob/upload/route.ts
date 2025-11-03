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
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    // Ensure the server has the required Blob token configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set in the environment");
      return NextResponse.json(
        { error: "Server is missing BLOB_READ_WRITE_TOKEN" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const jsonResponse = await handleUpload({
      body: body as HandleUploadBody,
      request,
      onBeforeGenerateToken: async (pathname: string, clientPayload: string | null) => {
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

        return {
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
            timestamp
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          // Parse token payload
          let payload = {};
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
            filename: (payload as any).originalFilename || 
                     blob.pathname?.split('/').pop() || 
                     'unknown',
            mime: blob.contentType || inferMimeType(blob.pathname),
            sizeBytes: 0,
          };

          await upsertRecurso(recursoData);
          
          console.log("Resource registered successfully:", blob.url);
        } catch (error) {
          console.error("Error registering resource:", error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
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