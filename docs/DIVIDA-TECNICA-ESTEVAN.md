# Dívidas Técnicas - Páginas de Cursos, Prova e Lista

## 1. Duplicação de Código entre Páginas de Prova e Lista

**Arquivo afetados:** 
- `src/app/(app)/(professor)/provas/page.jsx`
- `src/app/(app)/(professor)/listas/criar/page.jsx`

**Descrição:**
As páginas de criação de prova e lista possuem código quase idêntico para gerenciamento de questões, incluindo:
- Funções `handleToggleQuestao`, `handleMoveUp`, `handleMoveDown`, `handleRemoveQuestao`
- Lógica de pontuação com `handleChangePontuacao` e `calcularTotalPontos`
- Renderização da lista de questões selecionadas e disponíveis
- Estados similares (`selectedQuestoes`, `questoesPontuacao`, `questoes`, `loadingQuestoes`)

**Impacto:** Alta manutenção, risco de inconsistências ao corrigir bugs em apenas um lugar.

**Sugestão de Correção:** Extrair lógica comum para um custom hook `useQuestaoSelection` e criar componentes reutilizáveis como `<QuestoesSelecionadas />` e `<QuestoesDisponiveis />`.

---

## 2. Ausência de Tratamento de Erros Consistente nas Chamadas de API

**Arquivos afetados:**
- `src/app/(app)/(professor)/cursos/page.jsx`
- `src/app/(app)/(professor)/provas/page.jsx`
- `src/app/(app)/(professor)/listas/criar/page.jsx`

**Descrição:**
As chamadas `fetch` não possuem tratamento de erros padronizado:
- Em `cursos/page.jsx`: o erro é capturado mas a mensagem genérica "Erro desconhecido" pode não ser útil ao usuário
- Em `provas/page.jsx` e `listas/criar/page.jsx`: erros de rede não são diferenciados de erros de validação
- Não há retry automático ou indicação de problemas de conectividade
- Console.error exposto em produção (`console.error('Erro ao criar prova:', err);`)

**Impacto:** Experiência de usuário ruim ao enfrentar erros, dificuldade de debug em produção.

**Sugestão de Correção:** Criar um serviço centralizado de API com interceptadores de erro, implementar mensagens de erro específicas por tipo de falha, e remover/condicionar logs de console.

---

## 3. Falta de Validação de Formulário no Frontend

**Arquivos afetados:**
- `src/app/(app)/(professor)/provas/page.jsx`
- `src/app/(app)/(professor)/listas/criar/page.jsx`

**Descrição:**
A validação de formulários é feita de forma imperativa dentro do `handleSubmit`:
```javascript
if (!formData.titulo.trim()) {
  setError('O título da prova é obrigatório');
  return;
}
```

**Problemas identificados:**
- Validação ocorre apenas no submit, não em tempo real
- Não há indicação visual nos campos com erro (ex: borda vermelha, helperText)
- Campos `required` no HTML não são usados consistentemente
- Não há validação de formato para campos como data, duração, valor total
- A página de lista não valida se pelo menos uma questão foi selecionada

**Impacto:** Usuário precisa submeter o formulário para descobrir erros, experiência de preenchimento ruim.

**Sugestão de Correção:** Utilizar biblioteca de validação como `react-hook-form` com `zod` ou `yup`, adicionar feedback visual nos campos, implementar validação em tempo real.

---

## 4. Componentes com Responsabilidades Excessivas (Violação do Single Responsibility Principle)

**Arquivos afetados:**
- `src/app/(app)/(professor)/provas/page.jsx` (~550 linhas)
- `src/app/(app)/(professor)/listas/criar/page.jsx` (~450 linhas)

**Descrição:**
Os componentes `CriarProvaContent` e `CriarListaContent` acumulam muitas responsabilidades:
- Gerenciamento de estado do formulário
- Lógica de seleção e ordenação de questões
- Cálculo de pontuação
- Chamadas de API
- Navegação
- Renderização de múltiplas seções (header, cards, lista de questões, botões)

**Problemas identificados:**
- Difícil de testar unitariamente
- Difícil de reutilizar partes específicas
- Alto acoplamento entre UI e lógica de negócio
- Arquivos muito extensos dificultam manutenção

**Impacto:** Baixa testabilidade, dificuldade de manutenção, código difícil de entender.

**Sugestão de Correção:** 
- Extrair seções em componentes menores: `<ProvaHeader />`, `<ProvaInfoForm />`, `<ProvaQuestoesSection />`
- Mover lógica de estado para custom hooks: `useProvaForm()`, `useQuestaoSelection()`
- Separar chamadas de API em um service layer
