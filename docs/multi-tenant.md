# Sistema Multi-Tenant (Isolamento por Usuário)

**Status:** ✅ Implementado

## Visão Geral

Este documento descreve a implementação do sistema multi-tenant por usuário no projeto ES-UNIFESP-2025-2-GRUPO-GOLF. Todas as operações de leitura e escrita em `cursos`, `questoes` e `imagens` são agora escopadas pelo usuário autenticado, garantindo isolamento total de dados entre usuários.

## Mudanças Implementadas

### 1. Camada de Acesso a Dados (DAO/Service Layer)

Criados três services que encapsulam toda a lógica de acesso ao banco:

- **`src/services/db/cursos.service.ts`**: Operações CRUD de cursos
- **`src/services/db/questoes.service.ts`**: Operações CRUD de questões
- **`src/services/db/imagens.service.ts`**: Operações CRUD de imagens

**Princípios:**
- ✅ Todas as funções recebem `userId` como primeiro parâmetro obrigatório
- ✅ Create: injeta `ownerId = userId` (ignora qualquer ownerId do cliente)
- ✅ Read/List: SEMPRE filtra por `{ ownerId: userId }`
- ✅ Update/Delete: filtro inclui `{ _id, ownerId: userId }` (retorna 404 se não pertencer ao usuário)
- ✅ Validações de consistência: cursos/imagens referenciados devem pertencer ao mesmo owner

### 2. Modelo de Banco de Dados

**Campos adicionados a todas as coleções (`cursos`, `questoes`, `imagens`):**
```typescript
{
  ownerId: ObjectId,        // Obrigatório - ID do usuário dono
  createdBy: ObjectId,       // Opcional - quem criou
  updatedBy: ObjectId,       // Opcional - quem atualizou por último
  createdAt: Date,           // Data de criação
  updatedAt: Date            // Data de atualização
}
```

**Índices criados:**
- `cursos`: 
  - `{ ownerId: 1 }` - busca por dono
  - `{ ownerId: 1, slug: 1 }` - único por usuário
- `questoes`: 
  - `{ ownerId: 1 }` - busca por dono
  - `{ ownerId: 1, cursoIds: 1 }` - queries com cursos
- `imagens`: 
  - `{ ownerId: 1 }` - busca por dono

**Validadores de Schema MongoDB:**
- ✅ Tornam `ownerId` obrigatório em novos documentos
- ✅ Validam tipos corretos de campos

### 3. Migração de Dados

**Script:** `scripts/migrate-add-owner.ts`

**Executado com sucesso:**
- ✅ 7 cursos migrados (ownerId atribuído ao admin: `6908e64f2b35cf82b83f10d0`)
- ✅ 135 questões migradas
- ✅ 0 imagens migradas (ainda não havia imagens)
- ✅ 7 cursos sem slug corrigidos automaticamente
- ✅ Índices criados com sucesso
- ✅ Validadores de schema aplicados

### 4. Proteção de Rotas

**Middleware (`middleware.ts`) expandido para proteger:**

**Páginas:**
- `/cursos/*` - Todas as páginas de cursos
- `/questoes/*` - Todas as páginas de questões
- `/galeria/*` - Galeria de imagens
- `/dashboard/*` - Dashboard do usuário
- `/provas/*` - Geração e correção de provas
- `/correcao/*` - Correção de provas

**APIs Principais:**
- `/api/cursos/*` - APIs de cursos (CRUD completo)
- `/api/questoes/*` - APIs de questões (CRUD completo + tags)
- `/api/galeria/*` - APIs de galeria/imagens

**APIs de Upload e Recursos:**
- `/api/blob/*` - Upload de arquivos para Vercel Blob
- `/api/recursos/*` - Gerenciamento de recursos

**APIs de IA (todas requerem autenticação):**
- `/api/ai/gerar-alternativa` - Gera distratores usando IA
- `/api/ai/gerar-enunciado` - Gera enunciado usando IA
- `/api/ai/revisar-questao` - Revisa questão usando IA

**APIs de Geração e Correção:**
- `/api/gerar-prova/*` - Geração de provas em PDF
- `/api/correcao/*` - Upload e correção de provas

**Rotas públicas (não afetadas):**
- `/` - Landing page
- `/login` - Página de login
- `/cadastro` - Cadastro (se existir)
- `/api/auth/*` - Next-Auth (callbacks, sessão)

### 5. APIs Refatoradas

#### **Cursos (`/api/cursos`)**
- ✅ GET: lista apenas cursos do usuário (com contagem de questões)
- ✅ POST: cria curso vinculado ao usuário (valida slug único por usuário)
- ✅ GET `/:id`: busca curso específico (404 se não pertencer ao usuário)
- ✅ PUT `/:id`: atualiza curso (404 se não pertencer ao usuário)
- ✅ DELETE `/:id`: deleta curso (404 se não pertencer ao usuário)

#### **Questões (`/api/questoes`)**
- ✅ GET: lista apenas questões do usuário (com filtros por curso, tags, tipo, dificuldade)
- ✅ POST: cria questão vinculada ao usuário
  - ✅ Valida que todos os `cursoIds` pertencem ao usuário
  - ✅ Valida que todos os `imagemIds` pertencem ao usuário
  - ✅ Retorna 400 se houver "Owner mismatch"
- ✅ GET `/:id`: busca questão específica (404 se não pertencer ao usuário)
- ✅ PUT `/:id`: atualiza questão (404 se não pertencer ao usuário)
  - ✅ Valida ownership de cursos/imagens referenciados
- ✅ DELETE `/:id`: deleta questão (404 se não pertencer ao usuário)

#### **Galeria (`/api/galeria`)**
- ✅ GET: lista apenas imagens do usuário
- ✅ POST: faz upload vinculado ao usuário
- ✅ DELETE: deleta imagem (apenas se pertencer ao usuário)
  - ✅ Impede deleção se houver questões usando a imagem

### 6. Helpers de Autenticação

**Arquivo:** `src/lib/auth-helpers.ts`

**Funções:**
```typescript
// Obtém userId ou retorna 401 (use em todas as APIs protegidas)
getUserIdOrUnauthorized(): Promise<string | NextResponse>

// Obtém a sessão completa
getSession(): Promise<Session | null>

// Verifica se está autenticado
isAuthenticated(): Promise<boolean>
```

**Uso em APIs:**
```typescript
export async function GET(request: NextRequest) {
  const userIdOrError = await getUserIdOrUnauthorized();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;
  
  // Usar userId nas operações...
}
```

## Segurança e Garantias

### ✅ Isolamento por Usuário
- **Nenhuma API retorna dados de outro usuário**
- **Tentativas de acesso a recursos alheios retornam 404** (não vaza a existência)
- **ownerId é SEMPRE injetado no servidor** (nunca confiamos no cliente)

### ✅ Validações de Consistência
- **Cursos referenciados em questões devem pertencer ao mesmo owner**
- **Imagens referenciadas em questões devem pertencer ao mesmo owner**
- **Erro 400 "Owner mismatch" se houver inconsistência**

### ✅ Unicidade Escópica
- **Slug de curso é único POR USUÁRIO** (não globalmente)
- **Cada usuário pode ter seu próprio curso com slug "matematica"**

### ✅ Auditoria
- **createdBy/updatedBy registram quem fez a operação**
- **createdAt/updatedAt registram quando**

## Testes de Segurança

Para validar o isolamento, execute os seguintes testes:

### 1. Sem Sessão
```bash
# Deve retornar 401 ou redirecionar para /login
curl http://localhost:3000/api/cursos
curl http://localhost:3000/api/questoes
curl http://localhost:3000/api/galeria
```

### 2. Com Sessão (Usuário A)
```typescript
// Criar curso
POST /api/cursos { nome, codigo, slug }
// Deve persistir com ownerId do Usuário A

// Listar cursos
GET /api/cursos
// Deve retornar apenas cursos do Usuário A
```

### 3. Tentativa de Acesso Cruzado
```typescript
// Usuário A tenta acessar curso do Usuário B
GET /api/cursos/[id_do_usuario_B]
// Deve retornar 404 (não 403, para não vazar existência)

// Usuário A tenta criar questão com curso do Usuário B
POST /api/questoes { cursoIds: [id_do_usuario_B] }
// Deve retornar 400 "Owner mismatch"
```

### 4. APIs de IA (Requerem Autenticação)
```bash
# Sem sessão - deve retornar 401
curl -X POST http://localhost:3000/api/ai/gerar-alternativa
curl -X POST http://localhost:3000/api/ai/gerar-enunciado
curl -X POST http://localhost:3000/api/ai/revisar-questao

# Com sessão - deve funcionar normalmente
```

### 5. Geração de Prova (Isolamento)
```bash
# Usuário A gera prova
POST /api/gerar-prova (com sessão do Usuário A)
# Deve usar apenas questões do Usuário A

# Usuário B gera prova
POST /api/gerar-prova (com sessão do Usuário B)
# Deve usar apenas questões do Usuário B (diferentes do A)
```

### 6. Validação de Índices
```bash
# Conectar ao MongoDB e verificar performance
db.cursos.find({ ownerId: ObjectId("...") }).explain("executionStats")
# Deve usar índice { ownerId: 1 }
```

## Retrocompatibilidade

### ✅ Front-End
- **Nenhuma mudança visual obrigatória**
- **Mesmos contratos de API mantidos** (apenas ownerId é transparente)
- **Componentes existentes funcionam sem alteração**

### ✅ Dados Antigos
- **Todos os 7 cursos existentes foram migrados** para o admin
- **Todas as 135 questões existentes foram migradas** para o admin
- **Slugs ausentes foram gerados automaticamente**
- **Sistema continua funcionando normalmente**

## Próximos Passos (Opcional)

### Melhorias Futuras
- [ ] Implementar compartilhamento de cursos/questões entre usuários
- [ ] Adicionar roles (admin, professor, aluno)
- [ ] Implementar soft-delete com campo `deletedAt`
- [ ] Adicionar logs de auditoria completos
- [ ] Implementar rate limiting por usuário
- [ ] Dashboard de analytics por usuário

### Otimizações
- [ ] Cache de queries frequentes (Redis)
- [ ] Paginação no service layer (atualmente na API)
- [ ] Bulk operations otimizadas
- [ ] Índices compostos adicionais conforme necessidade

## Comandos Úteis

```bash
# Executar migração novamente (idempotente)
npx tsx scripts/migrate-add-owner.ts

# Verificar dados no MongoDB
mongosh "mongodb+srv://..."
use projetoES
db.cursos.countDocuments({ ownerId: ObjectId("6908e64f2b35cf82b83f10d0") })
db.questoes.countDocuments({ ownerId: ObjectId("6908e64f2b35cf82b83f10d0") })

# Verificar índices
db.cursos.getIndexes()
db.questoes.getIndexes()
db.imagens.getIndexes()
```

## Conclusão

✅ **Sistema multi-tenant implementado com sucesso!**

Todas as rotas principais e APIs correspondentes:
- ✅ Exigem sessão válida
- ✅ Filtram dados por usuário automaticamente
- ✅ Validam ownership em operações
- ✅ Impedem acesso a recursos de outros usuários
- ✅ Mantêm consistência de dados
- ✅ Preservam retrocompatibilidade

O sistema está pronto para produção e garante isolamento completo entre usuários.
