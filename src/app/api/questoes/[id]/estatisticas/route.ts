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
 */
function aggregateStats(questao: any, respostas: any[], contextMaxScore: number) {
    const totalRespostas = respostas.length;

    // Normaliza para minúsculo para evitar quebras por formatação no banco
    const tipo = questao.tipo?.toLowerCase();

    // Se não tem respostas, mas sabemos quanto vale a questão (contextMaxScore), podemos retornar o gráfico vazio já na escala correta (ex: 0 a 2.0).
    if (totalRespostas === 0) {
        if (tipo === 'dissertativa') {
            // Usa a nota do contexto (prova/lista) se existir, senão 10.0
            const maxNota = contextMaxScore > 0 ? contextMaxScore : 10.0;
            const step = maxNota / 5;

            return {
                dados: Array.from({ length: 5 }).map((_, i) => {
                    const min = (step * i);
                    const max = (step * (i + 1));
                    // Ajuste visual para o último bucket fechar no valor exato
                    const labelMax = i === 4 ? max : max - 0.01;
                    return {
                        nome: `${min.toFixed(1)} - ${labelMax.toFixed(1)}`,
                        Respostas: 0
                    };
                }),
                meta: { qndNotaMinima: 0, qndNotaMaxima: 0, maxNotaGlobal: maxNota }
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

        // E. Dissertativa (Banco: 'dissertativa')
        case 'dissertativa': {
            const respostasValidas = respostas.filter(r =>
                r.pontuacaoObtida !== null &&
                r.pontuacaoObtida !== undefined &&
                !isNaN(Number(r.pontuacaoObtida))
            );

            // Lógica de Prioridade para definir a Nota Máxima Global (escala do gráfico):
            // 1. Tenta pegar o maior valor de "pontuacaoMaxima" encontrado no histórico das respostas.
            let maxNotaGlobal = 0;
            if (respostasValidas.length > 0) {
                maxNotaGlobal = Math.max(...respostasValidas.map(r => Number(r.pontuacaoMaxima || 0)));
            }

            // 2. Se não achou nas respostas (ou é zero), usa o valor encontrado nas Provas/Listas (contextMaxScore).
            if (maxNotaGlobal === 0 && contextMaxScore > 0) {
                maxNotaGlobal = contextMaxScore;
            }

            // 3. Fallback final para 10.0 apenas se não houver info em lugar nenhum.
            if (maxNotaGlobal === 0) {
                maxNotaGlobal = 10.0;
            }

            const step = maxNotaGlobal / 5;
            const faixas = [0, 0, 0, 0, 0];
            let qndNotaMinima = 0;
            let qndNotaMaxima = 0;

            if (respostasValidas.length > 0) {
                respostasValidas.forEach(r => {
                    const nota = Number(r.pontuacaoObtida);
                    // A nota máxima desta resposta específica (pode variar de prova para prova)
                    const maxDesta = Number(r.pontuacaoMaxima) > 0 ? Number(r.pontuacaoMaxima) : maxNotaGlobal;

                    if (nota === 0) qndNotaMinima++;
                    if (nota >= maxDesta) qndNotaMaxima++;

                    // Distribuição nos buckets
                    if (nota < step) faixas[0]++;
                    else if (nota < step * 2) faixas[1]++;
                    else if (nota < step * 3) faixas[2]++;
                    else if (nota < step * 4) faixas[3]++;
                    else faixas[4]++;
                });
            }

            const dados = faixas.map((qtd, i) => {
                const min = (step * i);
                const max = (step * (i + 1));
                const labelMax = i === 4 ? max : max - 0.01;
                return {
                    nome: `${min.toFixed(1)} - ${labelMax.toFixed(1)}`,
                    Respostas: qtd
                };
            });

            const meta = { qndNotaMinima, qndNotaMaxima, maxNotaGlobal };
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

        // 2. Buscar Vínculos (Provas e Listas) primeiro para descobrir a pontuação configurada
        const provas = await db.collection("provas")
            .find({ "questoes._id": questaoId })
            .project({ _id: 1, titulo: 1, cursoId: 1, questoes: 1 })
            .toArray();

        const listas = await db.collection("listasDeExercicios")
            .find({ "questoesIds": id })
            .project({ _id: 1, tituloLista: 1, cursoId: 1, questoesPontuacao: 1, usarPontuacao: 1 })
            .toArray();

        // 3. Calcular a maior pontuação atribuída a esta questão em qualquer atividade
        let maxPontuacaoContexto = 0;

        // Varre provas para achar essa questão e ver a pontuação
        provas.forEach((p: any) => {
            if (Array.isArray(p.questoes)) {
                // Tenta encontrar pelo ID original
                const q = p.questoes.find((qItem: any) =>
                    (qItem._id && qItem._id.toString() === questaoId.toString()) ||
                    (qItem.id === id) ||
                    // Algumas provas podem usar um campo de referência
                    (qItem.questaoOriginalId && qItem.questaoOriginalId.toString() === questaoId.toString())
                );

                if (q && Number(q.pontuacao) > maxPontuacaoContexto) {
                    maxPontuacaoContexto = Number(q.pontuacao);
                }
            }
        });

        // Varre listas
        listas.forEach((l: any) => {
            if (l.usarPontuacao && l.questoesPontuacao) {
                const pts = Number(l.questoesPontuacao[id]);
                if (!isNaN(pts) && pts > maxPontuacaoContexto) {
                    maxPontuacaoContexto = pts;
                }
            }
        });

        // 4. Buscar respostas dos alunos
        const respostas = await db.collection("respostasAluno")
            .find({ questaoId: questaoId })
            .project({ resposta: 1, isCorrect: 1, pontuacaoObtida: 1, pontuacaoMaxima: 1 })
            .toArray();

        // 5. Agregar estatísticas passando o contexto de pontuação encontrado
        const { dados, meta } = aggregateStats(questao, respostas, maxPontuacaoContexto);

        // 6. Montar resposta
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