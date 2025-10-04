import { handleUpload } from "@vercel/blob/client";
import { NextRequest } from "next/server";
import { upsertRecurso } from "../../../../lib/resources";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return new Response(
        JSON.stringify({ error: "Request body is required" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const response = await handleUpload({
      body: request.body as any, 
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
            sizeBytes: 0, // Size not available in PutBlobResult
          };

          // Upsert the resource in MongoDB
          await upsertRecurso(recursoData);
          
          console.log("✅ Resource registered successfully:", blob.url);
        } catch (error) {
          console.error("❌ Error registering resource:", error);
          // Don't throw here to avoid breaking the upload flow
        }
      },
    });

    // Ensure we always return a Response object
    if (response instanceof Response) {
      return response;
    }
    
    // Handle other response types by converting to Response
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: "Upload failed" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
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
