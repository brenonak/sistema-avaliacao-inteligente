import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

interface BlobDocument {
  url: string;
  createdAt: Date;
  updatedAt: Date;
  filename: string;
  key: string;
  mime: string;
  provider: 'vercel-blob';
  sizeBytes: number;
  status: 'pendente';
  nota: number;
  corrigido_em: Date | null;
  comentario: string | null;
  usage: {
    refCount: number;
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const provaId = formData.get('provaId') as string | undefined;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const correcaoCollection = db.collection('correcao');

    // Upload files to Vercel Blob and save to MongoDB
    const results = await Promise.all(
      files.map(async (file) => {
        // Criar um nome único para o arquivo usando timestamp e sufixo aleatório
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 15);
        const fileName = `${timestamp}-${randomSuffix}-${file.name}`;
        
        const blob = await put(fileName, file, {
          access: 'public',
        });

        // Create blob document
        const blobDoc: BlobDocument = {
          url: blob.url,
          createdAt: new Date(),
          updatedAt: new Date(),
          filename: file.name,
          key: blob.pathname,
          mime: file.type,
          provider: 'vercel-blob',
          sizeBytes: file.size,
          status: 'pendente',
          nota: -1,
          corrigido_em: null,
          comentario: null,
          usage: {
            refCount: 0
          }
        };

        // Save to MongoDB
        const result = await correcaoCollection.insertOne(blobDoc);
        return { ...blobDoc, _id: result.insertedId };
      })
    );

    return NextResponse.json({
      message: "Arquivos enviados com sucesso",
      arquivos: results
    });
  } catch (error) {
    console.error("Erro ao processar upload:", error);
    return NextResponse.json(
      { error: "Erro ao processar o upload dos arquivos" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = await getDb();
    const correcaoCollection = db.collection('correcao');

    if (id) {
      try {
        // Buscar um arquivo específico
        const arquivo = await correcaoCollection.findOne({ _id: new ObjectId(id) });
        if (!arquivo) {
          return NextResponse.json(
            { error: "Arquivo não encontrado" },
            { status: 404 }
          );
        }
        return NextResponse.json(arquivo);
      } catch (idError) {
        return NextResponse.json(
          { error: "ID de arquivo inválido" },
          { status: 400 }
        );
      }
    }

    // Listar todos os arquivos
    const arquivos = await correcaoCollection.find().toArray();
    return NextResponse.json(arquivos);
  } catch (error) {
    console.error("Erro ao buscar correções:", error);
    return NextResponse.json(
      { error: "Erro ao buscar correções" },
      { status: 500 }
    );
  }
}