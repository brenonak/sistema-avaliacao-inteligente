import { ObjectId } from "mongodb";

export type TipoQuestao = "alternativa" | "afirmacoes" | "numerica" | "proposicoes" | "vf" | "dissertativa";

export interface QuestaoDoc {
  _id: ObjectId;
  tipo: TipoQuestao;
  gabarito?: any;
  respostaCorreta?: any;
  alternativas?: any[];
  afirmacoes?: any[];
  proposicoes?: any[];
  pontuacao: number;
  tolerancia?: number;
  margemErro?: number;
}

export interface ResultadoCorrecao {
  isCorrect: boolean;
  pontuacaoObtida: number;
  pontuacaoMaxima: number;
}

/**
 * Função pura de correção baseada nos tipos de questão
 */
export function calcularCorrecao(questao: QuestaoDoc, respostaAluno: any): ResultadoCorrecao {
  let isCorrect = false;
  const pontuacaoMaxima = questao.pontuacao || 0;

  // Se a resposta for nula ou indefinida, já retorna erro (exceto se for dissertativa que pode ser avaliada depois)
  if (respostaAluno === null || respostaAluno === undefined) {
    return { isCorrect: false, pontuacaoObtida: 0, pontuacaoMaxima };
  }

  // Questões dissertativas geralmente requerem correção manual, 
  // mas aqui assumimos 0 até que o professor corrija, ou se tiver lógica automática simples.
  if (questao.tipo === 'dissertativa') {
    return { isCorrect: false, pontuacaoObtida: 0, pontuacaoMaxima };
  }

  switch (questao.tipo) {
    // 1. Única escolha (Radio Button)
    case "alternativa": {
      // Buscar a alternativa correta do gabarito
      const alternativaCorreta = questao.alternativas?.find((alt: any) => alt.correta);
      if (!alternativaCorreta) {
        console.warn('Questão de alternativa sem resposta correta definida');
        isCorrect = false;
        break;
      }

      // Comparar com a letra ou com o texto da alternativa
      const letraCorreta = alternativaCorreta.letra;
      const textoCorreto = alternativaCorreta.texto;
      const respostaStr = String(respostaAluno).trim();

      isCorrect = respostaStr === letraCorreta || respostaStr === textoCorreto;
      break;
    }

    // 2. Resposta Numérica (Input Number)
    case "numerica": {
      const valorGabarito = Number(questao.respostaCorreta);
      const valorAluno = Number(respostaAluno);
      const margemErro = questao.margemErro || 0;

      // Verifica se é um número válido e se está dentro da margem
      if (!isNaN(valorAluno)) {
        isCorrect = Math.abs(valorGabarito - valorAluno) <= margemErro;
      }
      break;
    }

    // 3. Verdadeiro ou Falso / Afirmações (Array Ordenado)
    case "vf":
    case "afirmacoes": {
      // Para afirmações, o gabarito é um array de booleanos na ordem das afirmações
      const gabaritoAfirmacoes = questao.afirmacoes?.map((af: any) => af.correta) || [];

      // Assumindo que respostaAluno chega como array de booleans
      if (Array.isArray(respostaAluno)) {
        isCorrect = JSON.stringify(gabaritoAfirmacoes) === JSON.stringify(respostaAluno);
      }
      break;
    }

    // 4. Proposições / Somatório
    case "proposicoes": {
      // Para proposições, calcular a soma das corretas
      const somaCorreta = questao.proposicoes
        ?.filter((p: any) => p.correta)
        .reduce((sum: number, p: any) => sum + (p.valor || 0), 0) || 0;

      // Comparar com a resposta do aluno (que deve ser um número)
      isCorrect = Number(respostaAluno) === somaCorreta;
      break;
    }

    default:
      console.warn(`Tipo de questão desconhecido ou não suportado para correção automática: ${questao.tipo}`);
      isCorrect = false;
  }

  const pontuacaoObtida = isCorrect ? pontuacaoMaxima : 0;

  return {
    isCorrect,
    pontuacaoObtida,
    pontuacaoMaxima
  };
}
