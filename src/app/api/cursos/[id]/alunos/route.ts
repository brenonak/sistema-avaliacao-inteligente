import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function GET() {
  // MOCK: Lista estática de alunos para teste
  //TODO: Assim que houver diferenciação de alunos e professores no sistema, é estritamente necessário ajustar este mock para a aplicação real
  // Geram-se IDs reais do Mongo para não quebrar a validação 'oid()' do service
  const alunosMock = [
    { 
      _id: new ObjectId().toString(), // Gera um ID válido aleatório
      nome: "Aluno Exemplo 01", 
      email: "aluno01@teste.com" 
    },
    { 
      _id: new ObjectId().toString(), 
      nome: "Aluno Exemplo 02", 
      email: "aluno02@teste.com" 
    },
    { 
      _id: new ObjectId().toString(), 
      nome: "Aluno Exemplo 03", 
      email: "aluno03@teste.com" 
    },
    { 
      _id: new ObjectId().toString(), 
      nome: "Aluno Exemplo 04", 
      email: "aluno04@teste.com" 
    },
    { 
      _id: new ObjectId().toString(), 
      nome: "Aluno Exemplo 05", 
      email: "aluno05@teste.com" 
    }
  ];

  // Retorna no formato que o seu hook useAlunos espera ({ items: [] } ou direto [])
  return NextResponse.json({ 
    items: alunosMock 
  });
}