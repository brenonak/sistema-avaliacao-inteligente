# Refatoração do Sistema de Submissões

## Contexto
Este documento descreve a refatoração realizada no sistema de entrega de atividades (Provas e Listas de Exercícios). Anteriormente, as respostas dos alunos eram salvas de forma granular e independente na coleção `respostasAluno`. A nova arquitetura introduz o conceito de **Submissão**, que agrupa todas as respostas de um aluno para uma determinada atividade.

## Problema Anterior
O modelo anterior baseava-se em salvar cada resposta individualmente. Isso gerava alguns problemas:
- **Dificuldade de Gestão de Estado**: Não havia um lugar centralizado para saber se o aluno "terminou" a prova ou se ainda estava fazendo. O estado "finalizado" era replicado em cada resposta.
- **Cálculo de Notas**: Para saber a nota total, era necessário somar as notas de todas as respostas individuais em tempo de execução.
- **Performance**: Consultar o histórico de um aluno exigia buscar dezenas de documentos pequenos.
- **Inconsistência**: Era possível ter respostas "finalizadas" e outras "em aberto" para a mesma prova se houvesse erro de sincronia.

## Nova Arquitetura

### Entidade: Submissão
Foi criada uma nova coleção no MongoDB chamada `submissoes`. Cada documento representa a tentativa de um aluno em uma Prova ou Lista.

**Estrutura do Documento:**
```typescript
interface Submissao {
  _id: ObjectId;
  alunoId: ObjectId;
  referenciaId: ObjectId; // ID da Prova ou Lista
  tipo: "PROVA" | "LISTA";
  status: "EM_ANDAMENTO" | "FINALIZADO";
  dataInicio: Date;
  dataFim?: Date;
  notaTotal: number;
  respostas: RespostaSubmissao[]; // Array com as respostas
  createdAt: Date;
  updatedAt: Date;
}
```

### Componentes Criados/Alterados

1.  **Service (`src/services/db/submissoes.service.ts`)**:
    - Responsável por gerenciar o ciclo de vida da submissão.
    - Métodos: `iniciarSubmissao`, `registrarResposta`, `finalizarSubmissao`, `getSubmissao`.
    - Garante que a nota total seja recalculada a cada nova resposta.

2.  **Lógica de Correção (`src/lib/correction.ts`)**:
    - A lógica de correção automática (comparação de gabarito) foi extraída e centralizada.
    - Suporta tipos: `alternativa`, `numerica`, `afirmacoes`, `proposicoes`.

3.  **API Routes**:
    - **Listas**: `src/app/api/cursos/[id]/listas/[listaId]/respostas/route.ts`
    - **Provas**: `src/app/api/cursos/[id]/provas/[provaId]/respostas/route.ts`
    - Ambas as rotas foram refatoradas para:
        - Ler dados do `SubmissoesService`.
        - Ao receber um POST, calcular a correção usando `correction.ts` e salvar via `SubmissoesService`.

## Fluxo de Dados Atualizado

1.  **Início**: Quando o aluno começa ou envia a primeira resposta, uma `Submissao` é criada (ou recuperada) com status `EM_ANDAMENTO`.
2.  **Envio de Respostas**:
    - O frontend envia um array de respostas.
    - O backend itera sobre as respostas, corrige cada uma comparando com o gabarito (buscado no banco).
    - As respostas corrigidas são adicionadas ao array `respostas` dentro do documento da Submissão.
    - A `notaTotal` da submissão é atualizada atomicamente.
3.  **Finalização**:
    - Quando o frontend envia a flag `finalizado: true`, o status da submissão muda para `FINALIZADO` e a `dataFim` é registrada.
    - Submissões finalizadas não aceitam novas respostas.

## Benefícios da Mudança
- **Integridade**: O estado da prova é único e consistente.
- **Performance**: Menos operações de leitura/escrita dispersas.
- **Escalabilidade**: Facilita a implementação futura de recursos como:
    - Limite de tempo para prova (basta comparar `dataInicio` com `now`).
    - Múltiplas tentativas (basta criar novas submissões com IDs diferentes ou versionamento).
    - Relatórios de desempenho mais rápidos (basta ler `notaTotal` da submissão).
