# Autenticação - Next-Auth com Google OAuth

## Visão Geral

Sistema de autenticação implementado usando Next-Auth v4 com provider exclusivo do Google, persistência no MongoDB via adapter oficial, e proteção de rotas sensíveis.

## Variáveis de Ambiente

Configure as seguintes variáveis no `.env.local`:

```bash
# MongoDB
MONGODB_URI="sua_connection_string"
MONGODB_DB="nome_do_banco"

# Next-Auth
NEXTAUTH_URL=http://localhost:3000  # URL base da aplicação
AUTH_SECRET="seu_secret_aqui"       # Gerar com: npx auth secret

# Google OAuth
GOOGLE_CLIENT_ID="seu_client_id"
GOOGLE_CLIENT_SECRET="seu_client_secret"
```

### Como obter credenciais do Google OAuth:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Vá em **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth 2.0 Client ID**
5. Configure as URLs autorizadas:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
6. Copie o **Client ID** e **Client Secret**

## Estrutura de Arquivos

```
├── auth.ts                           # Configuração central do Next-Auth
├── middleware.ts                     # Middleware de proteção de rotas
├── types/
│   └── next-auth.d.ts               # Tipos customizados do Next-Auth
├── src/
│   ├── lib/
│   │   ├── mongodb.ts               # Conexão MongoDB (exporta clientPromise)
│   │   └── auth.ts                  # Utilitários de auth para Server Components
│   └── app/
│       ├── api/
│       │   └── auth/
│       │       └── [...nextauth]/
│       │           └── route.js     # Route handler do Next-Auth
│       ├── login/
│       │   └── page.jsx             # Página de login
│       └── components/
│           └── AuthProvider.jsx     # SessionProvider wrapper
```

## Rotas Protegidas

As seguintes rotas exigem autenticação (configuradas em `middleware.ts`):

- `/cursos/criar` - Criar novo curso
- `/questoes/criar` - Criar nova questão
- `/dashboard` - Dashboard do usuário

### Para adicionar mais rotas protegidas:

Edite o array `matcher` no arquivo `middleware.ts`:

```typescript
export const config = {
  matcher: [
    "/cursos/criar",
    "/questoes/criar",
    "/dashboard",
    "/sua-rota-aqui",  // Adicione aqui
  ],
};
```

## Rotas Públicas

Todas as demais rotas permanecem públicas:

- `/` - Landing page
- `/cursos` - Listagem de cursos
- `/cursos/[id]` - Visualização de curso
- `/questoes` - Listagem de questões
- `/login` - Página de login

## Uso em Componentes

### Client Components

```jsx
'use client';

import { useSession, signIn, signOut } from "next-auth/react";

export default function MeuComponente() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Carregando...</div>;
  }
  
  if (status === "unauthenticated") {
    return <button onClick={() => signIn("google")}>Login com Google</button>;
  }
  
  return (
    <div>
      <p>Olá, {session.user.name}!</p>
      <p>Email: {session.user.email}</p>
      <p>User ID: {session.user.id}</p>
      <button onClick={() => signOut()}>Sair</button>
    </div>
  );
}
```

### Server Components

```tsx
import { requireAuth } from "@/lib/auth";

export default async function PaginaProtegida() {
  // Redireciona automaticamente para /login se não autenticado
  const session = await requireAuth();
  
  return (
    <div>
      <h1>Bem-vindo, {session.user.name}!</h1>
      <p>Você está autenticado via {session.provider}</p>
    </div>
  );
}
```

### Verificação opcional (sem redirect):

```tsx
import { getSession } from "@/lib/auth";

export default async function MinhaPage() {
  const session = await getSession();
  
  if (!session) {
    return <div>Conteúdo público</div>;
  }
  
  return <div>Conteúdo para usuário autenticado</div>;
}
```

## Coleções MongoDB

O MongoDBAdapter cria automaticamente as seguintes coleções:

- `users` - Dados dos usuários
- `accounts` - Contas OAuth vinculadas
- `sessions` - Sessões ativas
- `verificationTokens` - Tokens de verificação

Estas coleções **não conflitam** com as coleções existentes:
- `questoes`
- `cursos`
- `recursos`

## Segurança

### Provider Exclusivo

✅ **Apenas Google é aceito** - O callback `signIn` bloqueia qualquer outro provider:

```typescript
if (account?.provider !== "google") {
  return false;  // Bloqueia login
}
```

### Email Verificado

✅ Apenas emails verificados pelo Google são aceitos:

```typescript
if (profile?.email && profile.email_verified) {
  return true;
}
```

### Runtime Node.js

✅ Força runtime Node.js (MongoDB driver não funciona no Edge):

```javascript
export const runtime = "nodejs";
```

### Sessão JWT

✅ Estratégia de sessão JWT (mais segura e escalável):

```typescript
session: {
  strategy: "jwt",
}
```

## Fluxo de Autenticação

1. **Usuário clica em "Entrar com Google"**
   - Redireciona para Google OAuth

2. **Google autentica o usuário**
   - Verifica credenciais
   - Solicita consentimento

3. **Callback do Google**
   - Next-Auth recebe o código OAuth
   - Callback `signIn` valida:
     - Provider = Google ✓
     - Email verificado ✓

4. **Sessão criada**
   - JWT gerado e assinado
   - User ID incluído na sessão
   - Cookie seguro definido

5. **Persistência no MongoDB**
   - Adapter cria/atualiza registro em `users`
   - Vincula conta em `accounts`

6. **Acesso às rotas protegidas**
   - Middleware valida JWT
   - Permite acesso se válido

## Troubleshooting

### Erro: "OAuthSignin"

**Causa**: Credenciais do Google incorretas ou URL não autorizada

**Solução**:
1. Verifique `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
2. Confirme URLs autorizadas no Google Cloud Console
3. Verifique `NEXTAUTH_URL` no `.env.local`

### Erro: "Session required"

**Causa**: Middleware bloqueando acesso sem sessão

**Solução**: Fazer login via `/login`

### Erro: MongoDB connection

**Causa**: `MONGODB_URI` inválida ou banco inacessível

**Solução**:
1. Verifique string de conexão
2. Confirme que o IP está na whitelist do MongoDB Atlas
3. Teste conexão: `node -e "require('./src/lib/mongodb.ts')"`

### Adapter não cria coleções

**Causa**: `clientPromise` não exportado corretamente

**Solução**: Verificar export em `src/lib/mongodb.ts`:
```typescript
export { clientPromise };
```

## Deploy em Produção

1. **Atualizar NEXTAUTH_URL**:
   ```bash
   NEXTAUTH_URL=https://seu-dominio.com
   ```

2. **Adicionar URL ao Google Cloud Console**:
   - Authorized origins: `https://seu-dominio.com`
   - Redirect URIs: `https://seu-dominio.com/api/auth/callback/google`

3. **Verificar AUTH_SECRET**:
   ```bash
   # Gerar novo secret para produção
   npx auth secret
   ```

4. **Validar variáveis de ambiente** na plataforma de deploy (Vercel, etc)

## Testando Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env.local
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 3. Executar em desenvolvimento
npm run dev

# 4. Acessar
# - Landing: http://localhost:3000
# - Login: http://localhost:3000/login
# - Dashboard: http://localhost:3000/dashboard (requer login)
```

## Compatibilidade

✅ Mantém 100% de compatibilidade com código existente
✅ Não afeta rotas públicas
✅ Não modifica coleções existentes
✅ Adiciona apenas proteção às rotas sensíveis
