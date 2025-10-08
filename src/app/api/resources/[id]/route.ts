import { NextRequest, NextResponse } from "next/server";
import { getRecursoById, deleteRecurso } from "../../../../lib/resources";
import { del } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    const recurso = await getRecursoById(id);
    
    if (!recurso) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resource: recurso
    });

  } catch (error) {
    console.error("Error fetching resource:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch resource",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // First, get the resource to check if it's in use and get the URL
    const recurso = await getRecursoById(id);
    
    if (!recurso) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if resource is in use
    if (recurso.usage.refCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete resource that is in use",
          details: `Resource has ${recurso.usage.refCount} references`
        },
        { status: 409 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(recurso.url);
    } catch (blobError) {
      console.warn("Failed to delete from Vercel Blob:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from MongoDB
    const deleted = await deleteRecurso(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete resource from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting resource:", error);
    
    if (error instanceof Error && error.message.includes("in use")) {
      return NextResponse.json(
        { 
          error: "Cannot delete resource that is in use",
          details: error.message
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to delete resource",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
