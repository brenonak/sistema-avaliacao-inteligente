# Fluxo de Completar Perfil (Profile Completion Flow)

## Visão Geral

Este documento descreve o fluxo implementado para garantir que novos usuários completem seu perfil após o primeiro login via Google OAuth.

## Comportamento

### Primeiro Login (Novo Usuário)
1. Usuário faz login via Google OAuth
2. Next-Auth cria documento na coleção `users` sem o campo `profileCompleted`
3. Middleware detecta ausência do campo e redireciona para `/cadastro`
4. Usuário preenche formulário com:
   - Nome completo (obrigatório)
   - Papel: Professor ou Aluno (obrigatório)
   - Instituição de Ensino (opcional)
   - Curso (opcional)
   - Áreas de Interesse (opcional, múltipla escolha)
5. Ao submeter, dados são salvos via `POST /api/profile/complete`
6. Campo `profileCompleted: true` é adicionado ao documento do usuário
7. Usuário é redirecionado para `/dashboard`

### Logins Subsequentes
1. Usuário faz login via Google OAuth
2. Middleware verifica campo `profileCompleted: true`
3. Usuário é direcionado diretamente para `/dashboard`

## Estrutura de Arquivos

```
src/
├── app/
│   ├── cadastro/
│   │   └── page.jsx          # Página do formulário de cadastro
│   └── api/
│       └── profile/
│           └── complete/
│               └── route.ts   # API POST/GET para perfil
├── lib/
│   └── validation.ts          # Zod schema (CompleteProfileSchema)
└── middleware.ts              # Verifica profileCompleted
```

## Endpoints da API

### `POST /api/profile/complete`

Salva os dados do perfil do usuário.

**Body:**
```json
{
  "nome": "João Silva",
  "papel": "professor",
  "instituicao": "UNIFESP",
  "curso": "Engenharia de Software",
  "areasInteresse": ["Cálculo", "IA", "Web"],
  "profileCompleted": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso"
}
```

**Response (400):**
```json
{
  "error": "Dados inválidos",
  "details": { ... }
}
```

### `GET /api/profile/complete`

Verifica se o perfil está completo.

**Response (200):**
```json
{
  "profileCompleted": true,
  "profile": {
    "nome": "João Silva",
    "papel": "professor",
    "instituicao": "UNIFESP",
    "curso": "Engenharia de Software",
    "areasInteresse": ["Cálculo", "IA", "Web"]
  }
}
```

## Schema de Validação

```typescript
CompleteProfileSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  papel: z.enum(["professor", "aluno"], {
    errorMap: () => ({ message: "Papel deve ser 'professor' ou 'aluno'" }),
  }),
  instituicao: z.string().optional(),
  curso: z.string().optional(),
  areasInteresse: z.array(z.string()).optional(),
  profileCompleted: z.boolean().default(true),
})
```

## Middleware Logic

O middleware implementa cache em memória (1 minuto) para evitar consultas repetidas ao MongoDB:

```typescript
// Verificação de cache
const cached = profileCache.get(userId);
if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
  return cached.completed;
}

// Query ao MongoDB se não estiver em cache
const user = await db.collection("users").findOne({ 
  _id: new ObjectId(userId) 
});

const completed = user?.profileCompleted === true;

// Atualizar cache
profileCache.set(userId, { completed, timestamp: Date.now() });
```

## Rotas Protegidas

As seguintes rotas requerem autenticação E perfil completo:
- `/dashboard`
- `/cursos/*`
- `/questoes/*`
- `/galeria/*`
- `/provas/*`
- `/correcao/*`
- Todas as APIs correspondentes

A rota `/cadastro` requer apenas autenticação (não verifica `profileCompleted`).

## Estrutura do Documento User

```javascript
{
  _id: ObjectId("..."),
  email: "joao@gmail.com",
  name: "João Silva",
  image: "https://...",
  emailVerified: null,
  
  // Campos adicionados pelo formulário de cadastro
  nome: "João da Silva",
  papel: "professor",
  instituicao: "UNIFESP",
  curso: "Engenharia de Software",
  areasInteresse: ["Cálculo", "IA", "Web"],
  profileCompleted: true
}
```

## Migração de Usuários Existentes

Para adicionar `profileCompleted: true` a usuários existentes:

```bash
node scripts/add-profile-completed-field.js
```

Este script:
1. Busca usuários sem o campo `profileCompleted`
2. Adiciona `profileCompleted: true` para todos
3. Exibe resumo da atualização

## Fluxograma

```
Login via Google
      |
      v
Next-Auth cria/atualiza user
      |
      v
Middleware verifica profileCompleted
      |
      +------ Não existe ou false -----> /cadastro
      |                                      |
      |                                      v
      |                              Preenche formulário
      |                                      |
      |                                      v
      |                              POST /api/profile/complete
      |                                      |
      |                                      v
      |                              profileCompleted: true
      |                                      |
      +------ true --------------------------+
                                             |
                                             v
                                        /dashboard
```

## Testes

### Testar Primeiro Login
1. Criar novo usuário no Google
2. Fazer login no sistema
3. Verificar redirecionamento para `/cadastro`
4. Preencher formulário
5. Verificar redirecionamento para `/dashboard`

### Testar Login Subsequente
1. Fazer logout
2. Fazer login novamente
3. Verificar redirecionamento direto para `/dashboard` (pula `/cadastro`)

### Verificar Cache do Middleware
1. Fazer login
2. Navegar entre páginas protegidas
3. Verificar logs: deve usar cache na segunda navegação
4. Aguardar 1 minuto
5. Navegar novamente
6. Verificar logs: deve consultar DB novamente após expiração do cache

## Troubleshooting

### Redirecionamento infinito para /cadastro
- Verificar se `profileCompleted: true` foi salvo no banco
- Verificar se middleware está pegando o `userId` correto do token
- Limpar cache do middleware: reiniciar servidor

### Dados não sendo salvos
- Verificar validação Zod no backend
- Verificar body da requisição no Network tab
- Verificar logs do servidor para erros

### Middleware não redirecionando
- Verificar se `/cadastro` está no matcher do middleware
- Verificar se token JWT tem o campo `id` correto
- Verificar variáveis de ambiente (MONGODB_URI, MONGODB_DB)

## Considerações de Performance

1. **Cache em Memória**: Middleware usa cache de 1 minuto para evitar queries repetidas
2. **Índice MongoDB**: Considerar criar índice em `users.profileCompleted` se houver muitos usuários
3. **Session Cookies**: Next-Auth usa JWT, então não há round-trip adicional para verificar sessão

## Melhorias Futuras

- [ ] Adicionar `profileCompleted` ao objeto de sessão para evitar middleware query
- [ ] Permitir edição de perfil em página dedicada (`/perfil`)
- [ ] Adicionar upload de foto de perfil via `/api/blob/upload`
- [ ] Validação de email institucional para professores
- [ ] Sugestões de áreas de interesse baseadas em cursos
