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

        const prova = await db.collection('provas').findOne({ _id: provaOid });
        if (!prova) {
            return NextResponse.json({ message: 'Prova não encontrada' }, { status: 404 });
        }

        // calcula valor total
        let valorTotal = Number(prova.valorTotal);
        if (isNaN(valorTotal) || valorTotal <= 0) {
            valorTotal = (prova.questoes || []).reduce((acc: number, q: any) => acc + (Number(q.pontuacao) || 0), 0);
        }
        if (valorTotal === 0) valorTotal = 10;

        // busca respostas relacionadas (listaId é usado tanto para listas quanto para provas)
        const respostas = await db.collection('respostasAluno')
            .find({ listaId: provaOid })
            .project({ ownerId: 1, questaoId: 1, pontuacaoObtida: 1, pontuacaoMaxima: 1 })
            .toArray();

        // agrupa notas por aluno
        const notasPorAluno: Record<string, number> = {};
        respostas.forEach((r: any) => {
            const uid = r.ownerId?.toString();
            if (!uid) return;
            if (!notasPorAluno[uid]) notasPorAluno[uid] = 0;
            notasPorAluno[uid] += (Number(r.pontuacaoObtida) || 0);
        });

        const listaNotas = Object.values(notasPorAluno);
        const totalAlunos = listaNotas.length;

        let mediaGeral = 0;
        let maiorNota = 0;
        let menorNota = 0;
        if (totalAlunos > 0) {
            const soma = listaNotas.reduce((a, b) => a + b, 0);
            mediaGeral = soma / totalAlunos;
            maiorNota = Math.max(...listaNotas);
            menorNota = Math.min(...listaNotas);
        }

        // histograma em 5 faixas
        const step = valorTotal / 5;
        const histogramaDados: Array<any> = [];
        let qndNotaMinima = 0;
        let qndNotaMaxima = 0;

        for (let i = 0; i < 5; i++) {
            const min = i * step;
            const max = (i + 1) * step;
            const label = `${Number.isInteger(min) ? min : min.toFixed(1)} - ${Number.isInteger(max) ? max : max.toFixed(1)}`;
            histogramaDados.push({ nome: label, Respostas: 0, minVal: min, maxVal: max });
        }

        listaNotas.forEach(nota => {
            if (nota === 0) qndNotaMinima++;
            if (nota >= valorTotal) qndNotaMaxima++;

            for (let i = 0; i < 5; i++) {
                const bucket = histogramaDados[i];
                const isLast = i === 4;
                if (isLast) {
                    if (nota >= bucket.minVal && nota <= bucket.maxVal + 0.01) { bucket.Respostas++; break; }
                } else {
                    if (nota >= bucket.minVal && nota < bucket.maxVal) { bucket.Respostas++; break; }
                }
            }
        });

        const dadosHistogramaLimpos = histogramaDados.map(({ nome, Respostas }) => ({ nome, Respostas }));

        // desempenho por questão
        const mapQuestaoIndex = new Map();
        (prova.questoes || []).forEach((q: any, index: number) => {
            const qId = q._id?.toString() || q.id;
            if (qId) mapQuestaoIndex.set(qId, `Q${index + 1}`);
        });

        const performanceMap: Record<string, { obtido: number, maximo: number }> = {};
        respostas.forEach((r: any) => {
            const qId = r.questaoId?.toString();
            if (!qId) return;
            if (mapQuestaoIndex.has(qId)) {
                if (!performanceMap[qId]) performanceMap[qId] = { obtido: 0, maximo: 0 };
                performanceMap[qId].obtido += (Number(r.pontuacaoObtida) || 0);
                performanceMap[qId].maximo += (Number(r.pontuacaoMaxima) || 0);
            }
        });

        const desempenhoPorQuestao = (prova.questoes || []).map((q: any, index: number) => {
            const qId = q._id?.toString() || q.id;
            const stats = performanceMap[qId];
            let percentual = 0;
            if (stats && stats.maximo > 0) percentual = (stats.obtido / stats.maximo) * 100;

            return {
                nome: `Q${index + 1}`,
                Respostas: parseFloat(percentual.toFixed(1)),
                correta: true
            };
        });

        return NextResponse.json({
            resumo: { mediaGeral, totalAlunos, maiorNota, menorNota },
            distribuicaoNotas: { dados: dadosHistogramaLimpos, meta: { qndNotaMinima, qndNotaMaxima } },
            desempenhoPorQuestao
        });

    } catch (error) {
        console.error('Erro analytics (provas route):', error);
        return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
    }
}
