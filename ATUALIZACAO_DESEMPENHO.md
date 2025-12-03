# Atualização: Substituição de Dados Mockados por Dados Reais da API

## Resumo
Foi substituído o sistema de gráficos de evolução de desempenho do aluno que utilizava dados mockados por um sistema que utiliza dados reais provenientes da API, organizados por curso e com histórico detalhado de submissões.

## Alterações Realizadas

### 1. API: `/src/app/api/desempenho/route.ts`

#### Modificações principais:
- **Pipeline de agregação melhorado**: O pipeline foi refatorado para capturar todas as informações necessárias sobre cada submissão (provas e listas)
- **Dados estruturados por curso**: Novo objeto `graficosPorCurso` retorna dados separados por curso
- **Histórico detalhado**: Cada curso agora inclui:
  - `examsLabels` e `examsScores`: Dados de provas
  - `listsLabels` e `listsScores`: Dados de listas de exercícios
  - `combinedLabels` e `combinedScores`: Dados combinados
  - `history`: Array com detalhes de cada submissão (id, título, tipo, data, nota, pontuação máxima, status)

#### Nova estrutura retornada:
```javascript
{
  cursos: [...],
  provasPorCurso: {...},
  listasPorCurso: {...},
  studentStats: {
    mediaGeral: number,
    melhorNota: number,
    ultimaAvaliacao: number,
    historico: [{nota, data}, ...]
  },
  graficosPorCurso: {
    [cursoId]: {
      examsLabels: string[],
      examsScores: number[],
      listsLabels: string[],
      listsScores: number[],
      combinedLabels: string[],
      combinedScores: number[],
      history: [{id, title, type, date, score, maxScore, status}, ...]
    }
  },
  pendingActivities: [...]
}
```

### 2. Página: `/src/app/(app)/(aluno)/aluno/desempenho/page.jsx`

#### Melhorias implementadas:
- **Remoção de dados mockados**: Dados agora vêm 100% da API
- **Estados de carregamento e erro**: Adicionados estados visuais para:
  - Loading: Spinner com mensagem "Carregando dados de desempenho..."
  - Erro: Mensagem de erro clara em caso de falha na requisição
- **Tratamento seguro de valores vazios**: Proteção contra `NaN` em cálculos (média, melhor nota, última avaliação)
- **Seleção por curso**: Usuário pode filtrar dados por curso selecionado

#### Dados utilizados:
- Dados combinados (provas + listas) para visão geral
- Gráficos separados para provas e listas de exercícios
- Tabela histórica com detalhes de cada avaliação

### 3. Página Dashboard: `/src/app/(app)/(aluno)/aluno/dashboard/page.jsx`

#### Status:
- ✅ Página já estava corretamente implementada
- Continua utilizando `studentStats.historico` para o gráfico de evolução geral
- Dados são obtidos da mesma API `/api/desempenho`

## Como Funciona o Fluxo de Dados

```
1. Usuário acessa /aluno/desempenho ou /aluno/dashboard
2. useEffect é disparado e faz fetch em /api/desempenho
3. API busca submissões do aluno no MongoDB (coleção 'submissoes')
4. Para cada submissão (tipo PROVA ou LISTA):
   - Faz lookup para obter dados de prova ou lista
   - Calcula nota: (notaTotal / valorTotal) * 10 para provas
   - Ordena cronologicamente
5. API retorna dados estruturados por curso
6. Componente renderiza gráficos com dados reais
```

## Dados das Coleções MongoDB

### Submissões (submissoes)
```javascript
{
  alunoId: ObjectId,
  referenciaId: ObjectId, // ID da prova ou lista
  tipo: "PROVA" | "LISTA",
  status: "FINALIZADO",
  dataFim: Date,
  notaTotal: number,
  respostas: [...]
}
```

### Provas (provas)
- `valorTotal`: Pontuação máxima da prova
- `cursoId`: Curso a que pertence
- `titulo`: Título da prova
- `data`: Data da prova

### Listas de Exercícios (listasDeExercicios)
- `cursoId`: Curso a que pertence
- `tituloLista`: Título da lista

## Validação de Dados

A API agora garante:
- ✅ Notas calculadas corretamente (0-10 para provas)
- ✅ Dados organizados por curso
- ✅ Histórico ordenado cronologicamente
- ✅ Proteção contra divisão por zero
- ✅ Fallback para valores padrão caso não haja dados

## Testes

Todos os testes da página `DesempenhoPage` foram atualizados e passam com sucesso:
- ✅ 7/7 testes passando
- Testes validam:
  - Carregamento de cursos
  - Exibição de dados padrão
  - Seleção de curso
  - Atualização de gráficos
  - Exibição de histórico

## Como Testar

1. **No dashboard** (`/aluno/dashboard`):
   - Gráfico "Evolução do desempenho" mostra todas as submissões em ordem cronológica

2. **Na página de desempenho** (`/aluno/desempenho`):
   - Selecione um curso do dropdown
   - Veja gráficos separados de Provas e Listas
   - Expanda a tabela de histórico para ver detalhes

## Próximas Melhorias Sugeridas

- [ ] Adicionar filtro por período (mês/semestre)
- [ ] Implementar comparação com turma/média geral
- [ ] Adicionar indicadores de progresso
- [ ] Exportar dados em PDF
- [ ] Gráfico de tendência com previsão
