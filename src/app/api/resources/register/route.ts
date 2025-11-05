import { NextRequest, NextResponse } from "next/server";
import { upsertRecurso } from "../../../../lib/resources";
import { getUserIdOrUnauthorized } from "../../../../lib/auth-helpers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Validar sessão e obter userId
    const userIdOrError = await getUserIdOrUnauthorized();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const body = await request.json();
    
    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Prepare resource data
    const recursoData = {
      provider: "vercel-blob" as const,
      url: body.url,
      key: body.key,
      filename: body.filename || 'unknown',
      mime: body.mime || 'application/octet-stream',
      sizeBytes: body.sizeBytes || 0,
    };

    // Upsert the resource with userId
    const recurso = await upsertRecurso(recursoData, userId);

    return NextResponse.json({
      success: true,
      resource: recurso
    });

  } catch (error) {
    console.error("Error registering resource:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to register resource",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
