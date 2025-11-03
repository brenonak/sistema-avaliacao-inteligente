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
      // Bloquear qualquer provider que não seja Google
      if (account?.provider !== "google") {
        console.warn(`[Auth] Tentativa de login bloqueada: provider ${account?.provider}`);
        return false;
      }
      
      // Validação adicional: garantir que tem email verificado
      if (profile?.email && (profile as any).email_verified) {
        // Garantir que o usuário existe no banco de dados
        if (user?.id) {
          const client = await clientPromise;
          const db = client.db(process.env.MONGODB_DB);
          const usersCollection = db.collection("users");
          
          // Verificar se o usuário já existe
          const existingUser = await usersCollection.findOne({ email: profile.email });
          
          // Se não existe, criar o documento do usuário
          if (!existingUser) {
            await usersCollection.insertOne({
              name: profile.name || null,
              email: profile.email,
              image: (profile as any).picture || null,
              emailVerified: new Date(),
            });
            console.log(`[Auth] Usuário criado: ${profile.email}`);
          }
        }
        return true;
      }
      
      console.warn(`[Auth] Login Google bloqueado: email não verificado`);
      return false;
    },
    
    // Callback de JWT: incluir userId no token
    async jwt({ token, user, account }) {
      // Na primeira vez que o JWT é criado (após login)
      if (user) {
        token.id = user.id;
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
      }
      return session;
    },
    
    // Callback de redirect: redireciona para dashboard após login
    async redirect({ url, baseUrl }) {
      // Se está fazendo login (vindo da página de login), redireciona para dashboard
      if (url === baseUrl || url === `${baseUrl}/` || url.includes('/api/auth/callback')) {
        return `${baseUrl}/dashboard`;
      }
      // Se já tem um callbackUrl, usa ele
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Caso contrário, redireciona para dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  
  // Páginas customizadas
  pages: {
    signIn: "/login",
    error: "/login", // Redirecionar erros para página de login
  },
  
  // Debug em desenvolvimento
  debug: process.env.NODE_ENV === "development",
};
