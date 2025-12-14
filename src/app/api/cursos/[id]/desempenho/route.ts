import { NextRequest, NextResponse } from "next/server";
import { getUserIdOrUnauthorized } from "../../../../../lib/auth-helpers";
import { getDb } from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

const toNumber = (value: unknown, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const computeProvaMaxScore = (prova: any) => {
    const valorTotal = toNumber(prova?.valorTotal, 0);
    if (valorTotal > 0) return valorTotal;

    if (Array.isArray(prova?.questoes) && prova.questoes.length > 0) {
        const sum = prova.questoes.reduce((acc: number, q: any) => acc + toNumber(q?.pontuacao, 0), 0);
        if (sum > 0) return sum;
    }

    return 0;
};

const computeListaMaxScore = (lista: any) => {
    if (lista?.usarPontuacao && lista?.questoesPontuacao) {
        const total = Object.values(lista.questoesPontuacao).reduce<number>(
            (acc, val) => acc + toNumber(val, 0),
            0
        );
        if (total > 0) return total;
    }

    if (Array.isArray(lista?.questoes) && lista.questoes.length > 0) {
        const sum = lista.questoes.reduce((acc: number, q: any) => acc + toNumber(q?.pontuacao, 0), 0);
        if (sum > 0) return sum;
    }

    if (Array.isArray(lista?.questoesIds) && lista.questoesIds.length > 0) {
        return lista.questoesIds.length;
    }

    return 0;
};

const normalizeScore = (notaTotal: number, maxScore: number) => {
    if (!Number.isFinite(notaTotal)) return 0;
    const max = maxScore > 0 ? maxScore : 10;
    const normalized = (notaTotal / max) * 10;
    if (!Number.isFinite(normalized)) return 0;
    return Math.max(0, normalized);
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userIdOrError = await getUserIdOrUnauthorized();
        if (userIdOrError instanceof NextResponse) return userIdOrError;
        const userId = userIdOrError;

        const { id } = await params;
        const db = await getDb();

        // Garantir que o curso pertence ao professor
        const curso = await db.collection("cursos").findOne({
            _id: new ObjectId(id),
            ownerId: new ObjectId(userId),
        });

        if (!curso) {
            return NextResponse.json({ message: "Curso não encontrado" }, { status: 404 });
        }

        // Carregar provas e listas do curso
        const [provas, listas] = await Promise.all([
            db.collection("provas").find({ cursoId: id }).sort({ criadoEm: 1 }).toArray(),
            db.collection("listasDeExercicios").find({ cursoId: id }).sort({ criadoEm: 1 }).toArray(),
        ]);

        const provaMetas = provas.map((p: any, index: number) => ({
            id: p._id?.toString(),
            title: p.titulo || `Prova ${index + 1}`,
            date: p.data || p.criadoEm,
            maxScore: computeProvaMaxScore(p),
        }));

        const listaMetas = listas.map((l: any, index: number) => ({
            id: l._id?.toString(),
            title: l.tituloLista || l.titulo || `Lista ${index + 1}`,
            date: l.criadoEm,
            maxScore: computeListaMaxScore(l),
        }));

        const provaIds = provaMetas.map((p) => p.id).filter(Boolean).map((id) => new ObjectId(id));
        const listaIds = listaMetas.map((l) => l.id).filter(Boolean).map((id) => new ObjectId(id));

        // Buscar submissões relacionadas às provas e listas deste curso
        const submissoes = await db
            .collection("submissoes")
            .find({
                $or: [
                    { referenciaId: { $in: provaIds }, tipo: "PROVA" },
                    { referenciaId: { $in: listaIds }, tipo: "LISTA" },
                ],
                status: "FINALIZADO",
            })
            .toArray();

        // Agrupar submissões por referência
        const submissionsByRef = new Map<string, any[]>();
        submissoes.forEach((s: any) => {
            const key = s.referenciaId?.toString();
            if (!key) return;
            if (!submissionsByRef.has(key)) submissionsByRef.set(key, []);
            submissionsByRef.get(key)!.push(s);
        });

        const examsLabels: string[] = [];
        const examsScores: number[] = [];
        const listsLabels: string[] = [];
        const listsScores: number[] = [];
        const history: any[] = [];

        provaMetas.forEach((prova) => {
            examsLabels.push(prova.title);
            const subs = submissionsByRef.get(prova.id) || [];
            const medias = subs.map((s) => normalizeScore(toNumber(s.notaTotal, 0), prova.maxScore));
            const media = medias.length > 0 ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;
            examsScores.push(parseFloat(media.toFixed(2)));
            history.push({
                id: prova.id,
                type: "Prova",
                title: prova.title,
                date: prova.date || new Date().toISOString(),
                score: parseFloat(media.toFixed(2)),
                maxScore: 10,
                status: "Finalizado",
            });
        });

        listaMetas.forEach((lista) => {
            listsLabels.push(lista.title);
            const subs = submissionsByRef.get(lista.id) || [];
            const medias = subs.map((s) => normalizeScore(toNumber(s.notaTotal, 0), lista.maxScore));
            const media = medias.length > 0 ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;
            listsScores.push(parseFloat(media.toFixed(2)));
            history.push({
                id: lista.id,
                type: "Lista",
                title: lista.title,
                date: lista.date || new Date().toISOString(),
                score: parseFloat(media.toFixed(2)),
                maxScore: 10,
                status: "Finalizado",
            });
        });

        history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const combinedLabels = [
            ...examsLabels.map((l) => `Prova - ${l}`),
            ...listsLabels.map((l) => `Lista - ${l}`),
        ];
        const combinedScores = [...examsScores, ...listsScores];

        return NextResponse.json({
            examsLabels,
            examsScores,
            listsLabels,
            listsScores,
            combinedLabels,
            combinedScores,
            history,
        });
    } catch (error) {
        console.error("Erro ao carregar desempenho do curso:", error);
        return NextResponse.json({ message: "Erro interno" }, { status: 500 });
    }
}