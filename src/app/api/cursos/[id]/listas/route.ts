import { getDb } from "../../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../../lib/http";
import { ObjectId } from "mongodb";

// Helper para validar e converter ID
function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

/**
 * @swagger
 * /api/cursos/{id}/listas:
 * post:
 * summary: Cria uma nova lista de exercícios para um curso
 * tags: [Listas de Exercícios]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: ID do curso
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * tituloLista:
 * type: string
 * description: O nome da matéria ou tópico da lista
 * questoesIds:
 * type: array
 * items:
 * type: string
 * description: Um array de IDs (strings) das questões selecionadas
 * nomeInstituicao:
 * type: string
 * description: (Opcional) Nome da instituição de ensino
 * required:
 * - tituloLista
 * - questoesIds
 * responses:
 * 200:
 * description: Lista de exercícios criada com sucesso
 * 400:
 * description: Dados inválidos (ID do curso, ou corpo da requisição)
 * 404:
 * description: Curso não encontrado
 * 500:
 * description: Erro no servidor
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; 
    const _id = oid(id);
    if (!_id) return badRequest("ID de curso inválido");
    
    const body = await request.json();
    // Extrai os campos do corpo, incluindo o novo campo 'nomeInstituicao'
    const { tituloLista, questoesIds, nomeInstituicao, usarPontuacao, questoesPontuacao } = body;
    
    // Validação dos campos obrigatórios
    if (!tituloLista || !Array.isArray(questoesIds)) {
      return badRequest("Nome da matéria e um array de 'questoesIds' são obrigatórios");
    }
    
    const db = await getDb();
    
    // 1. Verificar se o curso pai existe
    const curso = await db.collection("cursos").findOne({ _id });
    if (!curso) return notFound("Curso não encontrado");
    
    // 2. Criar o documento da lista de exercícios
    const lista: any = {
      cursoId: id, 
      tituloLista,
      questoesIds,
      nomeInstituicao: nomeInstituicao || '', 
      usarPontuacao: usarPontuacao || false,
      criadoEm: new Date(),
    };
    
    // Adicionar pontuações se estiver usando pontuação
    if (usarPontuacao && questoesPontuacao) {
      lista.questoesPontuacao = questoesPontuacao;
    }
    
    const result = await db.collection("listasDeExercicios").insertOne(lista);
    
    return json({ 
      id: result.insertedId.toString(),
      message: 'Lista de exercícios criada com sucesso!',
      ...lista
    });
  } catch (e) {
    return serverError(e);
  }
}

/**
 * @swagger
 * /api/cursos/{id}/listas:
 * get:
 * summary: Lista todas as listas de exercícios de um curso
 * tags: [Listas de Exercícios]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: ID do curso
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Listas encontradas
 * 500:
 * description: Erro no servidor
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; 
    
    const db = await getDb();
    const listas = await db.collection("listasDeExercicios")
      .find({ cursoId: id }) 
      .sort({ criadoEm: -1 })
      .toArray();
    
    const listasFormatadas = listas.map(({ _id, ...rest }) => ({
      id: _id?.toString?.() ?? _id,
      ...rest
    }));
    
    return json({ items: listasFormatadas });
  } catch (e) {
    return serverError(e);
  }
}