import { NextRequest, NextResponse } from 'next/server';
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from 'mongodb';

function oid(id: string | undefined) {
    try { return id ? new ObjectId(id) : null; } catch { return null; }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; provaId: string }> }
) {
    try {
        const { provaId } = await params;
        const provaOid = oid(provaId);

        if (!provaOid) {
            return NextResponse.json({ message: 'ID de prova inválido' }, { status: 400 });
        }

        const db = await getDb();

        // busca submissões finalizadas para esta prova/lista
        const submissoes = await db.collection('submissoes')
            .find({ referenciaId: provaOid, status: "FINALIZADO" })
            .project({ alunoId: 1 })
            .toArray();

        const alunoIds = submissoes
            .map(s => s.alunoId)
            .filter(Boolean)
            .map(id => id.toString());

        return NextResponse.json({ corrigidos: Array.from(new Set(alunoIds)) });

    } catch (error) {
        console.error('Erro ao buscar corrigidos:', error);
        return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
    }
}