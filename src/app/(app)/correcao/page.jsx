
"use client";
import CorrecaoPageMui from "./CorrecaoPageMui";

// MOCKS: Substitua por fetch do backend depois
const provasMock = [
  {
    _id: "691bec7f6e55cddcc34535f5",
    titulo: "Matematica",
    instrucoes: "nao tire 0",
    nomeEscola: "unifesp",
    disciplina: "Teste",
    professor: "shogo",
    data: "1111-11-11",
    questoes: [
      {
        _id: "68cae90d923374bdea0ab71a",
        tipo: "Dissertativa",
        enunciado: "Explique a importância do Princípio da Inércia na Física clássica.",
      },
      {
        _id: "68cae90d923374bdea0ab71b",
        tipo: "Multipla Escolha",
        enunciado: "Qual é a capital da França?",
        alternativas: [
          "Paris",
          "Londres",
          "Berlim",
          "Roma"
        ]
      }
    ]
  }
];

const alunosMock = [
  { _id: "1", nome: "Aluno 1" },
  { _id: "2", nome: "Aluno 2" },
  { _id: "3", nome: "Aluno 3" },
];

export default function CorrecaoPage() {
  return <CorrecaoPageMui provas={provasMock} alunos={alunosMock} />;
}
