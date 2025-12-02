import { NextRequest, NextResponse } from 'next/server';
import { getDb } from "../../../../../../../lib/mongodb";
import { ObjectId } from 'mongodb';

function oid(id: string | undefined) {
    try { return id ? new ObjectId(id) : null; } catch { return null; }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { provaId: string } }
) {
    try {
        const { provaId } = params;
        const provaOid = oid(provaId);

        if (!provaOid) {
            return NextResponse.json({ message: 'ID de prova inválido' }, { status: 400 });
        }

        const db = await getDb();

        // busca respostas finalizadas para esta prova/lista
        const respostas = await db.collection('respostasAluno')
            .find({ listaId: provaOid, finalizado: true })
            .project({ ownerId: 1 })
            .toArray();

        const alunoIds = respostas
            .map(r => r.ownerId)
            .filter(Boolean)
            .map(id => id.toString());

        return NextResponse.json({ corrigidos: Array.from(new Set(alunoIds)) });

    } catch (error) {
        console.error('Erro ao buscar corrigidos:', error);
        return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
    }
}
