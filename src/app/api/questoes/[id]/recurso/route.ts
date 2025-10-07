import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../lib/http";
import { upload } from "@vercel/blob/client";
import { upsertRecurso, incrementResourceUsage } from "../../../../../lib/resources";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

// POST /questoes/:id/recurso - Adicionar nova imagem a uma questão
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Aguardar params antes de acessar suas propriedades
    const { id } = await params;
    const questaoId = oid(id);
    if (!questaoId) return badRequest("ID de questão inválido");

    // Verificar se o Content-Type é adequado para formData
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return badRequest("Content-Type deve ser multipart/form-data");
    }
    
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("Erro ao processar formData:", error);
      return badRequest("Erro ao processar o formulário");
    }
    
    const file = formData.get("file") as File;
    
    if (!file) {
      return badRequest("Nenhum arquivo enviado");
    }

    // Verificar se a questão existe
    const db = await getDb();
    const questao = await db.collection("questoes").findOne({ _id: questaoId });
    if (!questao) return notFound("Questão não encontrada");

    // Upload do arquivo para o blob
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
    });

    // Criar o documento recurso
    const recursoData = {
      provider: "vercel-blob" as const,
      url: blob.url,
      key: blob.pathname,
      filename: file.name,
      mime: file.type,
      sizeBytes: file.size,
    };

    const recurso = await upsertRecurso(recursoData);
    const recursoId = recurso._id?.toString();

    if (!recursoId) {
      return serverError("Falha ao criar recurso");
    }

    // Associar o recurso à questão
    const recursos = Array.isArray(questao.recursos) ? questao.recursos : [];
    if (!recursos.includes(recursoId)) {
      await db.collection("questoes").updateOne(
        { _id: questaoId },
        { 
          $push: { recursos: recursoId } as any,
          $set: { updatedAt: new Date() }
        }
      );
      
      // Incrementar o contador de uso do recurso
      await incrementResourceUsage([recursoId]);
    }

    return json({
      success: true,
      recurso: {
        id: recursoId,
        url: blob.url,
        filename: file.name,
        mime: file.type,
        size: file.size
      }
    }, 201);
  } catch (e) {
    console.error("Erro ao adicionar recurso:", e);
    return serverError(e);
  }
}