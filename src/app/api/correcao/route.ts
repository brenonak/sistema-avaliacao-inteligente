import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";
// Assumindo que você tenha alguma forma de obter a sessão do usuário
// import { getSession } from "next-auth/react"; // ou qualquer lib de auth

// --- 1. Definição das Interfaces ---

// O que esperamos que a IA nos retorne (simples)
interface QuestaoAIOutput {
  tipo: "multipla escolha" | "verdadeiro e falso" | "dissertativa" | "resposta numérica" | "proposicoes multiplas(somatório)";
  enunciado: string;
  alternativas: string[]; // IA só retorna um array de strings
  proposicoes: string[];  // IA só retorna um array de strings
  afirmacoes: string[];   // IA só retorna um array de strings
  tags: string[];
}

// O seu novo schema de Alternativa no DB
interface AlternativaDB {
  letra: string;
  texto: string;
  correta: boolean;
}

// O seu novo schema da Questão no DB
interface QuestaoDB {
  _id: ObjectId;
  tipo: string;
  enunciado: string;
  alternativas: AlternativaDB[];
  proposicoes: any[]; // TODO: Defina o schema de proposições se for complexo
  afirmacoes: any[];  // TODO: Defina o schema de afirmações se for complexo
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null; // ID do usuário
  ownerId: string | null;   // ID do usuário/organização
  updatedBy: string | null; // ID do usuário
  cursoIds: string[];
  imagemIds: string[];
}

// --- 2. Instanciação do Modelo ---
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash", 
  temperature: 0.3,
  maxOutputTokens: 2048,
});

// --- 3. O Prompt de Análise (Atualizado) ---
// Agora pedimos apenas os *textos* das alternativas
const PROMPT_ANALISE_PROVA = `
Você é um assistente de IA especialista em digitalização e catalogação de questões de provas.
Sua tarefa é analisar a imagem de uma prova, identificar CADA questão nela, e extrair as informações estruturadas.

Para CADA questão encontrada, gere um objeto JSON com o seguinte formato:
{
  "tipo": "Determine o tipo (ex: 'alternativa', 'proposicoes', 'dissertativa').",
  "enunciado": "O texto completo do enunciado da questão.",
  "alternativas": "Se for 'alternativa', um array de *strings* com o texto de cada alternativa. Ex: ["texto da alt A", "texto da alt B"]. Senão, [].",
  "proposicoes": "Se for 'proposicoes', um array de *strings* com o texto de cada proposição. Ex: ["texto 1", "texto 2"]. Senão, [].",
  "afirmacoes": "Se for 'afirmacoes', um array de *strings*. Senão, [].",
  "tags": "Gere um array de 2-3 tags de string (ex: 'literatura', 'rubem fonseca')."
}

REGRAS IMPORTANTES:
1.  Extraia APENAS o texto das alternativas/proposições, não as letras (A, B, C) ou números.
2.  Responda APENAS com o array JSON. Não inclua \`\`\`json ou qualquer outro texto explicativo.
`;

// --- 4. O Handler da API (POST) ---
export async function POST(req: Request) {
  try {
    // 1. Processar o upload da imagem (usando formData)
    const formData = await req.formData();
    const file = formData.get("prova") as File | null; 

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo 'prova' enviado." },
        { status: 400 }
      );
    }
    
    // TODO: Obter o ID do usuário da sessão
    // Ex: const session = await getSession({ req });
    // const userId = session?.user?.id || null;
    const mockUserId = "ID_DO_USUARIO_LOGADO"; // Substitua por um ID real da sessão

    // 2. Converter a imagem para Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    // 3. Montar a requisição multimodal para o LangChain
    const input = [
      new HumanMessage({
        content: [
          { type: "text", text: PROMPT_ANALISE_PROVA },
          {
            type: "image_url",
            image_url: `data:${mimeType};base64,${base64Image}`,
          },
        ],
      }),
    ];

    // 4. Executar o modelo
    const response = await model.invoke(input);
    const rawResponse = response.content.toString();
    console.log("Resposta bruta da IA:", rawResponse);

    // 5. Extrair e validar o JSON
    let questoesDaIA: QuestaoAIOutput[];
    try {
      questoesDaIA = JSON.parse(rawResponse);
    } catch {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/); 
      if (jsonMatch) {
        questoesDaIA = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Resposta da IA não contém um ARRAY JSON válido");
      }
    }

    // 6. Montar a resposta final com o Schema do DB
    const dataAtual = new Date();
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const questoesFormatadasDB: QuestaoDB[] = questoesDaIA.map((q) => {
      
      // Converte o array de strings da IA em um array de objetos AlternativaDB
      const alternativasFormatadas: AlternativaDB[] = (q.alternativas || []).map((texto, i) => ({
        letra: letras[i] || '?',
        texto: texto,
        correta: false, // Por padrão, nenhuma é correta. O usuário deve definir.
      }));
      
      // TODO: Fazer o mesmo para proposicoes e afirmacoes se elas tiverem schemas complexos

      return {
        _id: new ObjectId(),
        tipo: q.tipo,
        enunciado: q.enunciado,
        alternativas: alternativasFormatadas,
        proposicoes: [], // TODO: Formatar isso
        afirmacoes: [],  // TODO: Formatar isso
        tags: q.tags || [],
        createdAt: dataAtual,
        updatedAt: dataAtual,
        createdBy: mockUserId,
        ownerId: mockUserId,   // Ajuste esta lógica (talvez seja um orgId)
        updatedBy: mockUserId,
        cursoIds: [],
        imagemIds: [],
      };
    });

    console.log("Resultado processado:", questoesFormatadasDB);

    // 7. Retornar sucesso
    return NextResponse.json(questoesFormatadasDB);

  } catch (error) {
    // 8. Tratamento de erro
    console.error("Erro ao processar imagem:", error);
    return NextResponse.json(
      { error: "Erro ao processar imagem com IA.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}