# Relatório de Testes Automatizados

**Aluno:** Breno Cerqueira Reis Nakamura
**Branch:** `AVT-TESTE-BRENO`

## Introdução
Este relatório descreve os casos de teste implementados para validar a funcionalidade de "Estatísticas da Questão" (User Story #5 e #6). Foram criados testes automatizados utilizando **Jest** e **React Testing Library** para garantir a qualidade tanto da interface visual quanto da lógica de integração de dados.


## 1. Caso de Teste Unitário (Front-end Visual)

**Arquivo:** `src/app/components/questoes/charts/__tests__/HistogramaNotas.test.jsx`

### Cenário
Renderização do componente `HistogramaNotas` na dashboard do professor, simulando o recebimento de metadados que indicam notas extremas (alunos que tiraram nota zero e nota dez).

### Motivação
O histograma agrupa notas em faixas (ex: 0-2.0, 2.1-4.0, etc), o que pode ocultar visualmente quantos alunos tiraram exatamente zero ou dez. Assim, foram implementados componentes visuais do tipo "Chip" abaixo do gráfico para essa informação. O teste garante que esses elementos de destaque são renderizados corretamente com os números recebidos da API, independentemente da complexidade do gráfico SVG. 

### Resultado Esperado
Ao passar as props `meta={ qndNotaMinima: 2, qndNotaMaxima: 4 }`, o teste deve varrer e encontrar com sucesso os textos **"Nota Mínima: 5 alunos"** e **"Nota Máxima: 8 alunos"**.



## 2. Caso de Teste de Integração (Camada de Serviço)

**Arquivo:** `src/services/__tests__/statsService.test.js`

### Cenário
O sistema solicita os dados estatísticos de uma questão do tipo Dissertativa via `questaoStatsService`, que atua como intermediária entre o Front-end e a API.

### Motivação
A aplicação utiliza um padrão de Adapter para consumir dados. O teste visa garantir o contrato da interface: verificar se o serviço está construindo a URL do endpoint corretamente (`/api/questoes/{id}/estatisticas`) e se é capaz de processar a resposta JSON da API sem erros. Diferente do teste unitário, este teste valida a lógica de comunicação assíncrona e o tratamento da resposta.

### Resultado Esperado
Ao chamar a função assíncrona `getById('102')`, o serviço deve invocar o `fetch` com a URL correta e retornar um objeto formatado, onde: a propriedade `tipo` seja identificada como `'dissertativa'`; o objeto contenha a propriedade `meta` e contenha as chaves qndNotaMinima e qndNotaMaxima. (necessária para o teste unitário acima); e o objeto retornado seja idêntico ao mock fornecido, garantindo integridade dos dados.