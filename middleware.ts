/**
 * Middleware de autenticação
 * 
 * Protege rotas sensíveis que exigem login via Google.
 * 
 * ROTAS PROTEGIDAS (matcher):
 * - /cursos - Listagem de cursos (agora protegida - multi-tenant)
 * - /cursos/* - Todas as sub-rotas de cursos
 * - /questoes - Listagem de questões (agora protegida - multi-tenant)
 * - /questoes/* - Todas as sub-rotas de questões
 * - /galeria - Galeria de imagens
 * - /dashboard - Dashboard do usuário
 * - /api/cursos/* - APIs de cursos (protegidas)
 * - /api/questoes/* - APIs de questões (protegidas)
 * - /api/galeria/* - APIs de galeria (protegidas)
 * 
 * ROTAS PÚBLICAS (não afetadas):
 * - / (landing page)
 * - /login
 * - /cadastro
 * - /api/auth/* (Next-Auth)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MongoClient, ObjectId } from "mongodb";

console.log("[Middleware] 🚀 Middleware carregado e ativo!");

// Cache para verificação de perfil (evita queries repetidas)
const profileCache = new Map<string, { completed: boolean, timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos (reduzido para atualizar mais rápido)

async function isProfileCompleted(userId: string, forceRefresh: boolean = false): Promise<boolean> {
  console.log(`[isProfileCompleted] Verificando userId: ${userId}, forceRefresh: ${forceRefresh}`);
  
  // Se forceRefresh, limpar cache
  if (forceRefresh) {
    profileCache.delete(userId);
    console.log(`[isProfileCompleted] 🗑️ Cache limpo para forceRefresh`);
  }
  
  // Verificar cache
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[isProfileCompleted] ⚡ Cache hit - completed: ${cached.completed}`);
    return cached.completed;
  }
  
  console.log(`[isProfileCompleted] 💾 Cache miss - consultando banco...`);

  // Buscar no banco
  try {
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log(`[isProfileCompleted] Buscando user com _id: ${userId}`);
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(userId) 
    });
    await client.close();

    console.log(`[isProfileCompleted] User encontrado:`, user ? `email: ${user.email}` : 'null');
    console.log(`[isProfileCompleted] isProfileComplete no banco:`, user?.isProfileComplete);
    console.log(`[isProfileCompleted] profileCompleted no banco:`, user?.profileCompleted);
    
    // Verificar ambos os campos por compatibilidade
    const completed = user?.isProfileComplete === true || user?.profileCompleted === true;
    
    // Atualizar cache
    profileCache.set(userId, { completed, timestamp: Date.now() });
    console.log(`[isProfileCompleted] ✅ Cache atualizado - completed: ${completed}`);
    
    return completed;
  } catch (error) {
    console.error("[isProfileCompleted] ❌ Erro ao verificar perfil:", error);
    // Em caso de erro, assumir que está completo para não bloquear
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`\n[Middleware] ========== NOVA REQUISIÇÃO ==========`);
  console.log(`[Middleware] Pathname: ${pathname}`);
  console.log(`[Middleware] URL completa: ${request.url}`);
  
  // Permitir acesso à landing page sem autenticação
  if (pathname === "/") {
    console.log(`[Middleware] ✅ Landing page - permitindo sem autenticação`);
    return NextResponse.next();
  }
  
  // Obter token JWT da sessão
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  
  // Se não há token (não autenticado), redirecionar para login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    console.log(`[Middleware] ❌ Sem token - redirecionando para login`);
    return NextResponse.redirect(loginUrl);
  }
  
  console.log(`[Middleware] ✅ Token encontrado:`);
  console.log(`[Middleware]    - Email: ${token.email}`);
  console.log(`[Middleware]    - User ID: ${token.id}`);
  console.log(`[Middleware]    - Provider: ${token.provider}`);
  
  // Validação adicional: garantir que é login via Google
  if (token.provider !== "google") {
    console.warn(`[Middleware] ❌ Provider inválido: ${token.provider}`);
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se o perfil está completo
  const userId = token.id as string;
  
  if (!userId) {
    console.error(`[Middleware] ❌ ERRO: userId não encontrado no token!`);
    console.error(`[Middleware] Token completo:`, JSON.stringify(token, null, 2));
    return NextResponse.next(); // Permitir acesso para evitar loop
  }
  
  // Verificar se há parâmetro para forçar refresh do cache (após completar cadastro)
  const forceRefresh = request.nextUrl.searchParams.has('refreshProfile');
  
  console.log(`[Middleware] 🔍 Verificando profileCompleted para userId: ${userId}`);
  const profileCompleted = await isProfileCompleted(userId, forceRefresh);
  console.log(`[Middleware] 📊 profileCompleted = ${profileCompleted}`);

  // Se perfil incompleto e NÃO está tentando acessar /cadastro ou API de profile
  if (!profileCompleted && pathname !== "/cadastro" && !pathname.startsWith("/api/profile")) {
    console.log(`[Middleware] 🔄 Perfil incompleto - REDIRECIONANDO ${pathname} -> /cadastro`);
    const cadastroUrl = new URL("/cadastro", request.url);
    return NextResponse.redirect(cadastroUrl);
  }
  
  // Se está acessando /cadastro
  if (pathname === "/cadastro") {
    if (!profileCompleted) {
      // Perfil incompleto: permitir acesso ao cadastro
      console.log(`[Middleware] ✅ Permitindo acesso a /cadastro (perfil incompleto)`);
      return NextResponse.next();
    } else {
      // Perfil completo: redirecionar para dashboard
      console.log(`[Middleware] 🔄 Perfil completo - REDIRECIONANDO /cadastro -> /dashboard`);
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }
  
  // Se está acessando API de profile, permitir
  if (pathname.startsWith("/api/profile")) {
    console.log(`[Middleware] ✅ Permitindo acesso a API ${pathname}`);
    return NextResponse.next();
  }
  
  // Token válido e perfil completo, permitir acesso
  console.log(`[Middleware] ✅ Perfil completo - permitindo acesso a ${pathname}`);
  return NextResponse.next();
}

// Configuração do matcher - intercepta quase todas as rotas, exceto estáticos e API auth
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (landing page)
     * - /login (login page)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|static).*)",
  ],
};
