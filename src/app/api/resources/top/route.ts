import { NextRequest, NextResponse } from "next/server";
import { getTopRecursos } from "../../../../lib/resources";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    const recursos = await getTopRecursos(limit);
    
    // Return only the necessary fields
    const response = recursos.map(recurso => ({
      _id: recurso._id,
      url: recurso.url,
      filename: recurso.filename,
      mime: recurso.mime,
      sizeBytes: recurso.sizeBytes,
      usage: recurso.usage,
      createdAt: recurso.createdAt,
      updatedAt: recurso.updatedAt
    }));

    return NextResponse.json({
      success: true,
      resources: response,
      count: response.length
    });

  } catch (error) {
    console.error("Error fetching top resources:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch top resources",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
