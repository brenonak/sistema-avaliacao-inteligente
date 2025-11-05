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

export const authOptions: NextAuthOptions = {
  // Adapter MongoDB oficial - cria coleções: users, accounts, sessions, verificationTokens
  // Especifica o banco de dados correto (MONGODB_DB)
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }),
  
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
    
    // Callback de JWT: incluir userId no token
    async jwt({ token, user, account, trigger, session }) {
      // Na primeira vez que o JWT é criado (após login)
      if (user) {
        token.id = user.id;
        token.profileCompleted = (user as any).profileCompleted || false;
        console.log(`[Auth] JWT criado para userId: ${user.id}, email: ${user.email}, profileCompleted: ${token.profileCompleted}`);
      }
      
      // Permitir atualização do token quando o perfil é completado
      if (trigger === "update" && session?.profileCompleted !== undefined) {
        token.profileCompleted = session.profileCompleted;
        console.log(`[Auth] JWT atualizado - profileCompleted: ${token.profileCompleted}`);
      }
      
      // Incluir provider info
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    
    // Callback de session: incluir userId e provider na sessão
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session as any).provider = token.provider;
        (session.user as any).profileCompleted = token.profileCompleted || false;
      }
      return session;
    },
    
    // Callback de redirect: redireciona após autenticação
    async redirect({ url, baseUrl }) {
      console.log(`[Auth] Redirect callback - url: ${url}, baseUrl: ${baseUrl}`);
      
      // Se é uma URL relativa, combinar com baseUrl
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log(`[Auth] Redirecionando para URL relativa: ${redirectUrl}`);
        return redirectUrl;
      }
      
      // Se a URL é da mesma origem, permitir
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          console.log(`[Auth] Redirecionando para mesma origem: ${url}`);
          return url;
        }
      } catch (e) {
        console.error(`[Auth] Erro ao processar URLs:`, e);
      }
      
      // Caso padrão: redirecionar para dashboard
      const defaultUrl = `${baseUrl}/dashboard`;
      console.log(`[Auth] Redirecionando para URL padrão: ${defaultUrl}`);
      return defaultUrl;
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
