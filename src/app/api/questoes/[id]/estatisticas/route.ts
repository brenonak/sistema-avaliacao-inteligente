import { NextResponse } from 'next/server';
import { getDb } from "../../../../../lib/mongodb";
import { json, notFound, serverError, badRequest } from "../../../../../lib/http";
import { ObjectId } from "mongodb";

function oid(id: string) {
    try { return new ObjectId(id); } catch { return null; }
}

function toRoman(num: number): string {
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return romans[num - 1] || String(num);
}

/**
 * Função principal de agregação
 * Processa as respostas dos alunos e formata para os gráficos
 * @param questao Dados da questão
 * @param respostas Array de respostas dos alunos
 */
function aggregateStats(questao: any, respostas: any[]) {
    const totalRespostas = respostas.length;

    // Normaliza para minúsculo para evitar quebras por formatação no banco
    const tipo = questao.tipo?.toLowerCase();

    // Se não tem respostas, retorna vazio
    if (totalRespostas === 0) {
        if (tipo === 'dissertativa') {
            // Retorna estrutura vazia com as faixas de porcentagem padrão
            return {
                dados: [
                    { nome: '0% - 20%', Respostas: 0 },
                    { nome: '20% - 40%', Respostas: 0 },
                    { nome: '40% - 60%', Respostas: 0 },
                    { nome: '60% - 80%', Respostas: 0 },
                    { nome: '80% - 100%', Respostas: 0 },
                ],
                meta: { qndNotaMinima: 0, qndNotaMaxima: 0 }
            };
        }
        return { dados: [], meta: {} };
    }

    switch (tipo) {
        // A. Múltipla Escolha (Banco: 'alternativa')
        case 'alternativa': {
            const contagem: Record<string, number> = {};
            respostas.forEach(r => {
                const resp = r.resposta; // Ex: "A"
                if (resp) contagem[resp] = (contagem[resp] || 0) + 1;
            });

            const dados = (questao.alternativas || []).map((alt: any) => ({
                nome: alt.letra,
                Respostas: contagem[alt.letra] || 0,
                correta: alt.correta === true,
            }));
            return { dados, meta: {} };
        }

        // B. Múltiplas Afirmações (V/F) (Banco: 'afirmacoes')
        case 'afirmacoes': {
            const stats = (questao.afirmacoes || []).map(() => ({ acertos: 0, erros: 0 }));

            respostas.forEach(r => {
                const respostasAluno = r.resposta; // Ex: [true, false, true]
                if (!Array.isArray(respostasAluno)) return;

                questao.afirmacoes.forEach((afirmacaoGabarito: any, index: number) => {
                    const valAluno = respostasAluno[index];
                    const valGabarito = afirmacaoGabarito.correta;

                    if (String(valAluno) === String(valGabarito)) {
                        stats[index].acertos++;
                    } else {
                        stats[index].erros++;
                    }
                });
            });

            const dados = stats.map((s, index) => ({
                nome: toRoman(index + 1),
                acertos: totalRespostas > 0 ? (s.acertos / totalRespostas) * 100 : 0,
                erros: totalRespostas > 0 ? (s.erros / totalRespostas) * 100 : 0,
            }));
            return { dados, meta: {} };
        }

        // C. Somatório (Banco: 'proposicoes')
        case 'proposicoes': {
            const somaCorreta = (questao.proposicoes || [])
                .filter((p: any) => p.correta)
                .reduce((sum: number, p: any) => sum + (Number(p.valor) || 0), 0);

            const contagem = new Map<string, number>();
            respostas.forEach(r => {
                // Normaliza "5" para "05"
                const somaAluno = String(r.resposta || "0").padStart(2, '0');
                contagem.set(somaAluno, (contagem.get(somaAluno) || 0) + 1);
            });

            const dados = Array.from(contagem.entries()).map(([soma, qtd]) => ({
                nome: soma,
                Respostas: qtd,
                correta: Number(soma) === somaCorreta,
            })).sort((a, b) => Number(a.nome) - Number(b.nome));

            return { dados, meta: {} };
        }

        // D. Numérica (Banco: 'numerica')
        case 'numerica': {
            const respostaCorreta = Number(questao.respostaCorreta);
            const margem = Number(questao.margemErro) || 0;
            const contagem = new Map<string, number>();

            respostas.forEach(r => {
                const respAluno = String(r.resposta ?? "N/A");
                contagem.set(respAluno, (contagem.get(respAluno) || 0) + 1);
            });

            const dados = Array.from(contagem.entries()).map(([respStr, qtd]) => {
                const valorAluno = Number(respStr.replace(',', '.'));
                let isCorreta = false;
                if (!isNaN(valorAluno) && !isNaN(respostaCorreta)) {
                    isCorreta = Math.abs(valorAluno - respostaCorreta) <= margem;
                }
                return {
                    nome: respStr,
                    Respostas: qtd,
                    correta: isCorreta
                };
            }).sort((a, b) => b.Respostas - a.Respostas);

            return { dados, meta: {} };
        }

        // E. Dissertativa
        case 'dissertativa': {
            const respostasValidas = respostas.filter(r =>
                r.pontuacaoObtida !== null &&
                r.pontuacaoObtida !== undefined &&
                !isNaN(Number(r.pontuacaoObtida)) &&
                Number(r.pontuacaoMaxima) > 0 // Garante que não haverá divisão por zero
            );

            const faixas = [0, 0, 0, 0, 0]; // 0-20%, 20-40%, 40-60%, 60-80%, 80-100%
            let qndNotaMinima = 0; // Nota Zero absoluta
            let qndNotaMaxima = 0; // 100% da nota

            if (respostasValidas.length > 0) {
                respostasValidas.forEach(r => {
                    const nota = Number(r.pontuacaoObtida);
                    const maxDesta = Number(r.pontuacaoMaxima); // Máximo específico desta resposta

                    // Contabiliza extremos absolutos
                    if (nota === 0) qndNotaMinima++;
                    if (nota >= maxDesta) qndNotaMaxima++;

                    // Calcula porcentagem de aproveitamento (0 a 100)
                    const percentual = (nota / maxDesta) * 100;

                    // Distribuição nos buckets de 20%
                    if (percentual < 20) faixas[0]++;
                    else if (percentual < 40) faixas[1]++;
                    else if (percentual < 60) faixas[2]++;
                    else if (percentual < 80) faixas[3]++;
                    else faixas[4]++;
                });
            }

            const dados = [
                { nome: '0% - 20%', Respostas: faixas[0] },
                { nome: '20% - 40%', Respostas: faixas[1] },
                { nome: '40% - 60%', Respostas: faixas[2] },
                { nome: '60% - 80%', Respostas: faixas[3] },
                { nome: '80% - 100%', Respostas: faixas[4] }
            ];

            const meta = { qndNotaMinima, qndNotaMaxima };
            return { dados, meta };
        }

        default:
            return { dados: [], meta: {} };
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const questaoId = oid(id);

        if (!questaoId) {
            return badRequest("ID da questão inválido");
        }

        const db = await getDb();

        // 1. Buscar dados da questão
        const questao = await db.collection("questoes").findOne({ _id: questaoId });
        if (!questao) {
            return notFound("Questão não encontrada");
        }

        // 2. Buscar respostas dos alunos
        const respostas = await db.collection("respostasAluno")
            .find({ questaoId: questaoId })
            .project({ resposta: 1, isCorrect: 1, pontuacaoObtida: 1, pontuacaoMaxima: 1 })
            .toArray();

        // 3. Agregar estatísticas
        const { dados, meta } = aggregateStats(questao, respostas);

        // 4. Buscar vínculos apenas para informação visual
        const provas = await db.collection("provas")
            .find({ "questoes._id": questaoId }, { projection: { _id: 1, titulo: 1, cursoId: 1 } })
            .toArray();

        const listas = await db.collection("listasDeExercicios")
            .find({ "questoesIds": id }, { projection: { _id: 1, tituloLista: 1, cursoId: 1 } })
            .toArray();

        // 5. Retornar
        return json({
            tipo: questao.tipo,
            enunciado: questao.enunciado,
            dados,
            meta,
            vinculos: {
                provas: provas.map((p: any) => ({ id: p._id.toString(), titulo: p.titulo, cursoId: p.cursoId })),
                listas: listas.map((l: any) => ({ id: l._id.toString(), titulo: l.tituloLista, cursoId: l.cursoId }))
            },
            gabarito: {
                tipo: questao.tipo,
                alternativas: questao.alternativas || [],
                afirmacoes: questao.afirmacoes || [],
                proposicoes: questao.proposicoes || [],
                respostaCorreta: questao.respostaCorreta,
                margemErro: questao.margemErro,
                gabaritoDissertativo: questao.gabarito
            }
        });

    } catch (e) {
        console.error("Erro ao buscar estatísticas:", e);
        return serverError(e);
    }
}