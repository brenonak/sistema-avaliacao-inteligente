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

function traduzirTipoParaFrontend(tipo: string): string {
    switch (tipo) {
        case 'alternativa':
            return 'multipla-escolha';
        case 'afirmacoes':
            return 'verdadeiro-falso';
        case 'proposicoes':
            return 'somatorio';
        case 'dissertativa':
            return 'dissertativa';
        case 'numerica':
            return 'numerica';
        default:
            return tipo;
    }
}

/**
 * Função principal de agregação
 * Processa as respostas dos alunos e formata para os gráficos
 */
function aggregateStats(questao: any, respostas: any[]) {
    const totalRespostas = respostas.length;
    if (totalRespostas === 0) {
        return { dados: [], meta: {} };
    }

    const tipo = questao.tipo;

    switch (tipo) {
        // A. Múltipla Escolha
        case 'alternativa': {
            const contagem: Record<string, number> = {};
            respostas.forEach(r => {
                const resp = r.resposta; // Resposta do aluno (ex: "A")
                contagem[resp] = (contagem[resp] || 0) + 1;
            });

            const dados = questao.alternativas.map((alt: any) => ({
                nome: alt.letra,
                Respostas: contagem[alt.letra] || 0,
                correta: alt.correta || false,
            }));
            return { dados, meta: {} };
        }

        // B. Múltiplas Afirmações (V/F)
        case 'afirmacoes': {
            const stats = questao.afirmacoes.map(() => ({ acertos: 0, erros: 0 }));

            respostas.forEach(r => {
                const respostasAluno = r.resposta; // Array (ex: [true, false, true])
                if (!Array.isArray(respostasAluno)) return;

                questao.afirmacoes.forEach((afirmacaoGabarito: any, index: number) => {
                    if (respostasAluno[index] === afirmacaoGabarito.correta) {
                        stats[index].acertos++;
                    } else {
                        stats[index].erros++;
                    }
                });
            });

            const dados = stats.map((s, index) => ({
                nome: toRoman(index + 1),
                acertos: (s.acertos / totalRespostas) * 100, // Frontend espera %
                erros: (s.erros / totalRespostas) * 100,     // Frontend espera %
            }));
            return { dados, meta: {} };
        }

        // C. Proposições Múltiplas (Somatório)
        case 'proposicoes': {
            const somaCorreta = questao.proposicoes
                ?.filter((p: any) => p.correta)
                .reduce((sum: number, p: any) => sum + p.valor, 0) || 0;

            const contagem = new Map<string, number>();
            respostas.forEach(r => {
                const somaAluno = String(r.resposta || "0").padStart(2, '0');
                contagem.set(somaAluno, (contagem.get(somaAluno) || 0) + 1);
            });

            const dados = Array.from(contagem.entries()).map(([soma, qtd]) => ({
                nome: soma,
                Respostas: qtd,
                correta: Number(soma) === somaCorreta,
            }));
            return { dados, meta: {} };
        }

        // D. Resposta Numérica
        case 'numerica': {
            const respostaCorreta = questao.respostaCorreta;
            const contagem = new Map<string, number>();

            respostas.forEach(r => {
                const respAluno = String(r.resposta || "N/A");
                contagem.set(respAluno, (contagem.get(respAluno) || 0) + 1);
            });

            const dados = Array.from(contagem.entries()).map(([resp, qtd]) => ({
                nome: resp,
                Respostas: qtd,
                correta: Number(resp) === respostaCorreta,
            }));
            return { dados, meta: {} };
        }

        // E. Dissertativa
        case 'dissertativa': {
            // DADOS NÃO EXISTEM AINDA
            // TODO: A correção manual precisa ser implementada primeiro.
            // O front-end espera dados em faixas e meta.
            const dados = [
                { nome: '0 - 2.0', Respostas: 0 },
                { nome: '2.1 - 4.0', Respostas: 0 },
                { nome: '4.1 - 6.0', Respostas: 0 },
                { nome: '6.1 - 8.0', Respostas: 0 },
                { nome: '8.1 - 10.0', Respostas: 0 },
            ];
            const meta = { qtdNotaZero: 0, qtdNotaDez: 0 };

            // TODO: Implementar a agregação de 'pontuacaoObtida' quando a correção manual for criada.

            return { dados, meta };
        }

        default:
            return { dados: [], meta: {} };
    }
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const questaoId = oid(params.id);
        if (!questaoId) {
            return badRequest("ID da questão inválido");
        }

        const db = await getDb();

        // Buscar a questão (para o gabarito e tipo)
        const questao = await db.collection("questoes").findOne({ _id: questaoId });
        if (!questao) {
            return notFound("Questão não encontrada");
        }

        // Buscar todas as respostas para esta questão
        const respostas = await db.collection("respostasAluno")
            .find({ questaoId: questaoId })
            .project({ resposta: 1, isCorrect: 1, pontuacaoObtida: 1 }) // Só precisamos destes campos
            .toArray();

        // Agregar os dados
        const { dados, meta } = aggregateStats(questao, respostas);

        // Buscar listas e provas que contêm esta questão
        const provas = await db.collection("provas")
            .find(
                { "questoes._id": questaoId },
                { projection: { _id: 1, titulo: 1, cursoId: 1 } }
            )
            .toArray();

        const listas = await db.collection("listasDeExercicios")
            .find(
                { "questoesIds": params.id },
                { projection: { _id: 1, tituloLista: 1, cursoId: 1 } }
            )
            .toArray();

        // Formatar os resultados para o frontend
        const provasInfo = provas.map(p => ({
            id: p._id.toString(),
            titulo: p.titulo,
            cursoId: p.cursoId
        }));

        const listasInfo = listas.map(l => ({
            id: l._id.toString(),
            titulo: l.tituloLista,
            cursoId: l.cursoId
        }));

        // Alinhar o tipo para o esperado no frontend
        const tipoFrontend = traduzirTipoParaFrontend(questao.tipo);

        return json({
            tipo: tipoFrontend,
            enunciado: questao.enunciado,
            dados,
            meta,
            vinculos: {
                provas: provasInfo,
                listas: listasInfo
            },
            gabarito: {
                tipo: questao.tipo, // O tipo original, ex: 'alternativa'
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