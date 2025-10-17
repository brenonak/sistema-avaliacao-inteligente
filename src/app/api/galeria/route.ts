import { put, list, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { upsertRecurso, getRecursosCollection } from "../../../lib/resources"

// GET - List all images
export async function GET(request: NextRequest) {
  try {
    // Fazer uma requisição para /api/recursos que já tem a lógica correta
    const response = await fetch(new URL("/api/recursos", request.url).toString())
    if (!response.ok) {
      throw new Error("Failed to fetch resources")
    }
    
    const data = await response.json()
    
    // Mapear os recursos para o formato esperado pela galeria
    const images = data.items.map((resource: any) => ({
      url: resource.url,
      pathname: resource.filename,
      uploadedAt: resource.updatedAt || resource.createdAt,
      size: resource.sizeBytes,
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Error listing images:", error)
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    // Register in MongoDB to maintain consistency
    const recurso = await upsertRecurso({
      provider: "vercel-blob",
      url: blob.url,
      key: blob.pathname,
      filename: file.name,
      mime: file.type,
      sizeBytes: file.size,
    })

    return NextResponse.json({
      url: recurso.url,
      pathname: recurso.filename,
      uploadedAt: recurso.createdAt.toISOString(),
      size: recurso.sizeBytes,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

// DELETE - Remove image
export async function DELETE(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { url } = body;
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: "No valid URL provided" }, { status: 400 });
    }

    try {
      // Get the resource from MongoDB first
      const collection = await getRecursosCollection();
      const recurso = await collection.findOne({ url });

      if (!recurso) {
        // Se não existe no MongoDB, tenta deletar do Blob de qualquer forma
        try {
          await del(url);
        } catch (blobError) {
          console.error("Failed to delete from blob storage:", blobError);
        }
        return NextResponse.json({ error: "Resource not found in database" }, { status: 404 });
      }

      // Check if the resource is in use
      if (recurso.usage.refCount > 0) {
        return NextResponse.json(
          { error: "Cannot delete resource that is in use by questions" },
          { status: 400 }
        );
      }

      // Delete from both Blob and MongoDB
      try {
        await del(url);
      } catch (blobError) {
        console.error("Failed to delete from blob storage:", blobError);
        throw new Error("Failed to delete from blob storage");
      }

      const deleteResult = await collection.deleteOne({ url });
      if (!deleteResult.deletedCount) {
        throw new Error("Failed to delete from database");
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error during delete operation:", error);
      throw error; // Re-throw para ser pego pelo try/catch externo
    }
  } catch (error) {
    console.error("Delete operation failed:", error);
    return NextResponse.json(
      { error: "Failed to delete resource", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}