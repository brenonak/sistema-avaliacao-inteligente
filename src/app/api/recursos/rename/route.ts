import { NextRequest, NextResponse } from "next/server";
import { getRecursosCollection } from "../../../../lib/resources";

export async function PATCH(req: NextRequest) {
  try {
    const { url, newFilename } = await req.json();

    // Validação dos campos obrigatórios
    if (!url || !newFilename) {
      return NextResponse.json(
        { error: "URL e novo nome do arquivo são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação do formato do novo nome do arquivo
    if (newFilename.length > 255) {
      return NextResponse.json(
        { error: "O nome do arquivo não pode ter mais de 255 caracteres" },
        { status: 400 }
      );
    }

    // Remove caracteres especiais e espaços em branco do início e fim
    const sanitizedFilename = newFilename.trim();
    if (!sanitizedFilename) {
      return NextResponse.json(
        { error: "O nome do arquivo não pode estar vazio" },
        { status: 400 }
      );
    }

    const collection = await getRecursosCollection();

    // Primeiro, verifica se o recurso existe
    const recurso = await collection.findOne({ url: url });
    
    if (!recurso) {
      return NextResponse.json(
        { error: "Recurso não encontrado" },
        { status: 404 }
      );
    }

    // Atualiza o nome do arquivo no MongoDB
    const result = await collection.updateOne(
      { url: url },
      { 
        $set: { 
          filename: sanitizedFilename,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Nenhuma alteração foi realizada" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Nome do arquivo atualizado com sucesso",
        filename: sanitizedFilename,
        resourceId: recurso._id.toString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating filename:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar o nome do arquivo" },
      { status: 500 }
    );
  }
}
