/**
 * Configuração central do Next-Auth
 * Task #221: Adicionar 'isProfileComplete' aos callbacks
 * Atualizado para suportar esquema do banco com múltiplos campos (isProfileComplete, profileComplete, profileCompleted)
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
      
      // Bloquear qualquer provider que não seja Google
      if (account?.provider !== "google") {
        console.warn(`[Auth] Login bloqueado: provider ${account?.provider} não permitido`);
        return false;
      }
      
      // Validação adicional: garantir que tem email verificado
      if (profile?.email && (profile as any).email_verified) {
        return true;
      }
      
      console.warn(`[Auth] Login bloqueado: email não verificado`);
      return false;
    },
    
    async jwt({ token, user, trigger, session }) {
      // 1. No Login Inicial (User vem do Adapter)
      if (user) {
        console.log("[Auth] JWT: Login inicial. 'user' está presente.");
        token.id = user.id;
        
        // FIX #221: Normaliza as múltiplas variações do banco para uma única propriedade no token
        // Lê: isProfileComplete OU profileComplete OU profileCompleted
        const isComplete = user.isProfileComplete || user.profileComplete || (user as any).profileCompleted || false;
        token.isProfileComplete = isComplete;
        token.profileComplete = isComplete; // Manter compatibilidade
        
        // Lê: role OU papel
        token.role = user.role || (user as any).papel || null;
      }

      // Se atualizarmos a sessão manualmente no cliente (ex: update({ isProfileComplete: true }))
      if (trigger === "update" && session) {
        if (session.isProfileComplete !== undefined) {
            token.isProfileComplete = session.isProfileComplete;
            token.profileComplete = session.isProfileComplete;
        }
      }

      if (!token.id) {
        return token;
      }

      // 2. Em acessos subsequentes: Re-consultar o DB para dados frescos
      try {
        const db = (await clientPromise).db(process.env.MONGODB_DB);
        
        // Busca apenas os campos necessários, incluindo as variações legadas (papel, profileCompleted)
        const dbUser = await db.collection("users").findOne(
          { _id: new ObjectId(token.id as string) },
          { projection: { 
              role: 1, 
              papel: 1,
              isProfileComplete: 1, 
              profileComplete: 1, 
              profileCompleted: 1, 
              name: 1, 
              email: 1, 
              image: 1 
          }}
        );

        if (dbUser) {
          // Lógica robusta: tenta todas as variações até achar um true
          const isComplete = dbUser.isProfileComplete || dbUser.profileComplete || dbUser.profileCompleted || false;
          token.isProfileComplete = isComplete;
          token.profileComplete = isComplete; // Manter compatibilidade
          
          // Prioriza 'role' (PROFESSOR), mas faz fallback para 'papel' (professor)
          token.role = dbUser.role || dbUser.papel || null;
          
          // Sincronizar dados de perfil
          if (dbUser.name) token.name = dbUser.name;
          if (dbUser.email) token.email = dbUser.email;
          if (dbUser.image) token.picture = dbUser.image;
          
          console.log(`[Auth] JWT Fresco: User ${token.email} - Role: ${token.role}, ProfileComplete: ${token.isProfileComplete}`);
        } else {
           console.warn("[Auth] JWT: Utilizador não encontrado no DB.");
        }
      } catch (error) {
        console.error("[Auth] JWT: Erro ao re-consultar usuário no DB:", error);
      }
      
      return token;
    },
    
    // Callback de session: incluir userId, role e profileComplete na sessão
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        
        // FIX #221: Passando a propriedade normalizada para o frontend
        session.user.isProfileComplete = token.isProfileComplete; 
        session.user.role = token.role;
        
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Se a URL é relativa (ex: "/dashboard"), permite
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Se a URL é absoluta, mas da nossa origem, permite
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) {
          return url;
        }
      } catch (e) {
        // ignora erros
      }
      
      return baseUrl;
    },
  },
  
  pages: {
    signIn: "/login",
  },
  
  debug: process.env.NODE_ENV === "development",
};