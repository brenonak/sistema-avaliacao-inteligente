# Relatório da atividade

## Teste unitário

Teste realizado pelo arquivo CasoTesteUnitarioPerformanceSumary.teste

Cenário: O teste avalia o componente PerformanceSummary, responsável por exibir o resumo de notas de um usuário. O cenário cobre duas situações distintas de renderização: uma com dados; outra sem dados

Motivação: Objetivo é garantir que todos os resultados foram exibidos de maneira correta.

Resultado Esperado: No caso em que há dados os valores a serem exibidos serão '75.5' , '90.0' , '82.0', com a formatação correta. Já no caso em que não há dados será exibido '-' . 

## Teste de Integração

Teste realizado pelo arquivo CasoTesteIntegracao.teste.jsx

Cenário: O teste simula o fluxo completo da página de Desempenho (DesempenhoPage). Envolve o carregamento inicial da página e a requisição de dados via API(mock).

Motivação: Verificar se a página é capaz de integrar corretamente os dados vindos do backend com os componentes de interface. O objetivo é assegurar que, ao receber os dados brutos da API (notas 80 e 100 para Matemática), a aplicação processe essas informações e atualize os cálculos de resumo automaticamente quando o usuário troca o filtro de curso.

Resultado Esperado: A função fetch deve ser chamada para o endpoint /api/desempenho. O seletor de cursos deve ser populado corretamente (exibindo "Matemática"). Após a seleção do curso 'math101', o resumo de desempenho deve ser recalculado e exibir: * 90.0 (Média entre 80 e 100). * 100.0 (Exibido duas vezes: uma como 'Melhor Nota' e outra como 'Última Avaliação').