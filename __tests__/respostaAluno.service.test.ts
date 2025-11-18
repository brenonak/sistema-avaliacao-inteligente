/**
 * @jest-environment node
 */


import { upsertRespostaAluno, getRespostaAlunoById, RespostaAluno } from '../src/services/db/respostaAluno.service';


import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';


import { getDb } from '../src/lib/mongodb'; 


jest.mock('../src/lib/mongodb', () => ({
    getDb: jest.fn(),
}));


let mongod: MongoMemoryServer;
let client: MongoClient;
let db: Db;


const alunoId = new ObjectId().toHexString();
const listaId = new ObjectId().toHexString();
const questaoId = new ObjectId().toHexString();



beforeAll(async () => {
  
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('test-db');

  
  (getDb as jest.Mock).mockResolvedValue(db);
});

afterAll(async () => {
  
  await client.close();
  await mongod.stop();
});

beforeEach(async () => {
  
  await db.collection('respostasAluno').deleteMany({});
  await db.collection('questoes').deleteMany({});

  
  await db.collection('questoes').insertOne({
    _id: new ObjectId(questaoId),
    titulo: 'Questão de teste',
  });
});

// ---- Testes ----

describe('RespostaAluno Service', () => {
  
  describe('upsertRespostaAluno', () => {

    it('deve CRIAR uma nova resposta se ela não existir', async () => {
      const input = {
        listaId: listaId,
        questaoId: questaoId,
        resposta: 'C',
        pontuacaoMaxima: 10,
        pontuacaoObtida: 10,
        isCorrect: true,
        finalizado: true,
      };

      const result = await upsertRespostaAluno(alunoId, input);

      
      expect(result).toBeDefined();
      expect(result.ownerId).toEqual(new ObjectId(alunoId));
      expect(result.questaoId).toEqual(new ObjectId(questaoId));
      expect(result.resposta).toBe('C');
      expect(result.isCorrect).toBe(true);
      expect(result.finalizado).toBe(true);
      expect(result.dataFinalizacao).toBeDefined();

      
      const dbEntry = await db.collection('respostasAluno').findOne({
        ownerId: new ObjectId(alunoId),
        questaoId: new ObjectId(questaoId),
      });
      
      expect(dbEntry).toBeDefined();
      expect(dbEntry?.resposta).toBe('C');
    });

    it('deve ATUALIZAR uma resposta existente', async () => {
      
      const inputInicial = {
        listaId: listaId,
        questaoId: questaoId,
        resposta: 'C',
        pontuacaoMaxima: 10,
        pontuacaoObtida: 10,
        isCorrect: true,
      };
      const respostaInicial = await upsertRespostaAluno(alunoId, inputInicial);
      expect(respostaInicial.resposta).toBe('C');

      
      const inputAtualizado = {
        listaId: listaId,
        questaoId: questaoId,
        resposta: 'D', 
        pontuacaoMaxima: 10,
        pontuacaoObtida: 0,
        isCorrect: false, 
      };

      const respostaAtualizada = await upsertRespostaAluno(alunoId, inputAtualizado);

      
      expect(respostaAtualizada).toBeDefined();
      expect(respostaAtualizada._id).toEqual(respostaInicial._id); // Mesmo ID
      expect(respostaAtualizada.resposta).toBe('D');
      expect(respostaAtualizada.isCorrect).toBe(false);
      expect(respostaAtualizada.updatedAt).not.toEqual(respostaInicial.createdAt);

      
      const count = await db.collection('respostasAluno').countDocuments();
      expect(count).toBe(1); 
    });
    
    it('deve falhar se a questaoId não existir', async () => {
      const input = {
        listaId: listaId,
        questaoId: new ObjectId().toHexString(), 
        resposta: 'A',
        pontuacaoMaxima: 10,
        pontuacaoObtida: 0,
        isCorrect: false,
      };

      
      await expect(upsertRespostaAluno(alunoId, input))
        .rejects
        .toThrow('A questão referenciada não foi encontrada.');
    });

  });
  
  describe('getRespostaAlunoById', () => {

    it('não deve permitir que um aluno veja a resposta de outro', async () => {
      const outroAlunoId = new ObjectId().toHexString();
      
      
      const input = {
        listaId: listaId,
        questaoId: questaoId,
        resposta: 'A',
        pontuacaoMaxima: 10,
        pontuacaoObtida: 10,
        isCorrect: true,
      };
      const respostaCriada = await upsertRespostaAluno(alunoId, input);
      const respostaId = respostaCriada._id!.toHexString();
      
      
      const resultado = await getRespostaAlunoById(outroAlunoId, respostaId);

      
      expect(resultado).toBeNull();
    });
    
  });
  
  
});