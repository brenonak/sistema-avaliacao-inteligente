/**
 * Configuração central do Next-Auth
 * 
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
 * - AUTH_SECRET: Segredo para assinar tokens JWT (gerar com: npx auth secret)
 * - GOOGLE_CLIENT_ID: Client ID do Google OAuth (Google Cloud Console)
 * - GOOGLE_CLIENT_SECRET: Client Secret do Google OAuth
 * - MONGODB_URI: URI de conexão com MongoDB
 * - MONGODB_DB: Nome do banco de dados
 * - NEXTAUTH_URL: URL base da aplicação (ex: http://localhost:3000)
 * 
 * ROTAS PROTEGIDAS (definidas no middleware.ts):
 * - /cursos/criar
 * - /cursos/[id]/editar (se implementado)
 * - /questoes/criar
 * - /questoes/[id]/editar (se implementado)
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { clientPromise } from "./src/lib/mongodb";
import { events } from "./src/lib/auth-events";
import { ObjectId } from 'mongodb';

export const authOptions: NextAuthOptions = {
  // Adapter MongoDB oficial - cria coleções: users, accounts, sessions, verificationTokens
  // Especifica o banco de dados correto (MONGODB_DB)
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }),

  // Eventos do adapter (manipulam o banco de dados)
  events,
  
  // Estratégia de sessão JWT (necessário para funcionar com adapter)
  session: {
    strategy: "jwt",
  },
  
  // Provider exclusivo: Google
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  
  // Callbacks
  callbacks: {
    // Callback de signIn: aceita APENAS logins do Google
    async signIn({ account, profile, user }) {
      console.log('[Auth] ===== SIGNIN CALLBACK =====');
      console.log('[Auth] Email:', profile?.email);
      console.log('[Auth] User ID:', user?.id);
      console.log('[Auth] Provider:', account?.provider);
      console.log('[Auth] Provider Account ID:', account?.providerAccountId);
      console.log('[Auth] Email Verified:', (profile as any)?.email_verified);
      
      // Bloquear qualquer provider que não seja Google
      if (account?.provider !== "google") {
        console.warn(`[Auth] Login bloqueado: provider ${account?.provider} não permitido`);
        return false;
      }
      
      // Validação adicional: garantir que tem email verificado
      if (profile?.email && (profile as any).email_verified) {
        console.log(`[Auth] Email verificado, permitindo login: ${profile.email}`);
        console.log(`[Auth] MongoDB Adapter processou user ID: ${user.id}`);
        
        // O MongoDB Adapter já cria/atualiza o usuário e a account automaticamente
        // Os índices únicos garantem que:
        // 1. users.email é único (cada email = 1 usuário)
        // 2. accounts.provider+providerAccountId é único (cada conta Google = 1 account)
        return true;
      }
      
      console.warn(`[Auth] Login bloqueado: email não verificado`);
      return false;
    },
    
    async jwt({ token, user, trigger }) {
      // 1. No Login Inicial (quando 'user' é passado pelo Adapter)
      // O 'user' aqui já contém 'profileComplete: false' (graças aos events)
      if (user) {
        console.log("[Auth] JWT: Login inicial. 'user' está presente.");
        token.id = user.id;
        token.profileComplete = (user as any).profileComplete || (user as any).isProfileComplete || false;
        token.role = (user as any).role || null; // Será null no login inicial
      }

      // Se o 'token.id' não existir (o que não deve acontecer, mas é uma
      // salvaguarda), paramos aqui para evitar um 'crash'.
      if (!token.id) {
        console.warn("[Auth] JWT: ID do token em falta, a saltar consulta ao DB.");
        return token;
      }

      // Em acessos subsequentes (ex: navegação, middleware)
      // Precisamos de re-consultar o DB para garantir que o 'role' e 'profileComplete' apareçam na sessão
      
      try {
        const db = (await clientPromise).db(process.env.MONGODB_DB);
        const dbUser = await db.collection("users").findOne({ 
          _id: new ObjectId(token.id as string) 
        });

        if (dbUser) {
          // Atualiza o token com os dados FRESCOS do banco de dados
          token.profileComplete = dbUser.profileComplete || dbUser.isProfileComplete || false;
          token.role = dbUser.role || null;
          
          // Sincronizar dados de perfil do banco para o token
          // Isso corrige o problema de nomes desatualizados ou incorretos
          if (dbUser.name) token.name = dbUser.name;
          if (dbUser.email) token.email = dbUser.email;
          if (dbUser.image) token.picture = dbUser.image;
          
          console.log(`[Auth] JWT: Token atualizado com dados frescos. User: ${token.name}, Role: ${dbUser.role}, ProfileComplete: ${token.profileComplete}`);
        } else {
          // O utilizador foi apagado do DB - manter valores padrão
          console.warn("[Auth] JWT: Utilizador não encontrado no DB.");
          token.profileComplete = false;
          token.role = null;
        }
      } catch (error) {
        console.error("[Auth] JWT: Erro ao re-consultar usuário no DB:", error);
        // Em caso de erro, manter os valores atuais do token
      }
      
      return token;
    },
    
    // Callback de session: incluir userId, role e profileComplete na sessão
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.profileComplete = token.profileComplete || false;
        session.user.role = token.role || null;
        
        // Garantir que a sessão use os dados atualizados do token (que vieram do banco)
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
        
        console.log(`[Auth] Session: User ${session.user.email} (${session.user.name}) - Role: ${session.user.role}, ProfileComplete: ${session.user.profileComplete}`);
      }
      return session;
    },
    
    /**
     * Callback de redirect (CORRIGIDO para ser "neutro")
     * A lógica de redirecionamento real será feita no middleware (Task #222/223)
     */
    async redirect({ url, baseUrl }) {
      console.log(`[Auth] Redirect callback - url: ${url}, baseUrl: ${baseUrl}`);
      
      // Se a URL é relativa (ex: "/dashboard"), permite
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Se a URL é absoluta, mas da nossa origem, permite
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) {
          return url;
        }
      } catch (e) {
        // ignora erros de URL inválida
      }
      
      // Caso padrão seguro: voltar para a página inicial
      console.log(`[Auth] Redirecionamento para origem externa bloqueado. A voltar para: ${baseUrl}`);
      return baseUrl;
    },
  },
  
  // Páginas customizadas
  pages: {
    signIn: "/login",
    // error: "/login", // Não redirecionar erros, deixar Next-Auth mostrar a mensagem
  },
  
  // Debug em desenvolvimento
  debug: process.env.NODE_ENV === "development",
};

