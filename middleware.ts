/**
 * Middleware de autenticação
 * 
 * Protege rotas sensíveis que exigem login via Google.
 * 
 * IMPORTANTE: Este middleware roda no Edge Runtime da Vercel, que não suporta
 * conexões diretas ao MongoDB. A verificação de profileCompleted é feita
 * via token JWT e validações nas próprias páginas.
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

console.log("[Middleware] 🚀 Middleware carregado e ativo!");

// Validar variáveis de ambiente críticas no carregamento
if (!process.env.AUTH_SECRET) {
  console.error("[Middleware] ❌ ERRO: AUTH_SECRET não configurado!");
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    console.log(`\n[Middleware] ========== NOVA REQUISIÇÃO ==========`);
    console.log(`[Middleware] Pathname: ${pathname}`);
    console.log(`[Middleware] URL completa: ${request.url}`);
    
    // Rotas públicas - permitir sem qualquer verificação
    const publicPaths = ["/", "/login"];
    if (publicPaths.includes(pathname)) {
      console.log(`[Middleware] ✅ Rota pública - permitindo sem autenticação: ${pathname}`);
      return NextResponse.next();
    }
    
    // Permitir acesso a /cadastro e /api/profile (mas exigem autenticação)
    if (pathname === "/cadastro" || pathname.startsWith("/api/profile")) {
      console.log(`[Middleware] ✅ Rota de cadastro/profile - verificação básica`);
      // Ainda precisa estar autenticado
      const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
      });
      
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        console.log(`[Middleware] ❌ Sem token - redirecionando para login`);
        return NextResponse.redirect(loginUrl);
      }
      
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

    // Verificar se o userId existe
    const userId = token.id as string;
    
    if (!userId) {
      console.error(`[Middleware] ❌ ERRO: userId não encontrado no token!`);
      console.error(`[Middleware] Token completo:`, JSON.stringify(token, null, 2));
      // Redirecionar para login se não tiver userId
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Verificar profileCompleted do token (atualizado via callback do NextAuth)
    const profileCompleted = token.profileCompleted === true;
    console.log(`[Middleware] 📊 profileCompleted (do token) = ${profileCompleted}`);

    // Se perfil incompleto, redirecionar para /cadastro
    if (!profileCompleted) {
      console.log(`[Middleware] 🔄 Perfil incompleto - REDIRECIONANDO ${pathname} -> /cadastro`);
      const cadastroUrl = new URL("/cadastro", request.url);
      return NextResponse.redirect(cadastroUrl);
    }
    
    // Token válido e perfil completo, permitir acesso
    console.log(`[Middleware] ✅ Perfil completo - permitindo acesso a ${pathname}`);
    return NextResponse.next();
  } catch (error) {
    // Log do erro mas permite a requisição continuar
    console.error("[Middleware] ❌ ERRO CRÍTICO no middleware:", error);
    console.error("[Middleware] Stack trace:", error instanceof Error ? error.stack : 'N/A');
    
    // Em caso de erro, permitir acesso para evitar quebrar a aplicação
    return NextResponse.next();
  }
}

// Configuração do matcher - intercepta rotas específicas, excluindo públicas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - / (root - landing page)
     * - /login (página de login)
     * - /api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - arquivos estáticos com extensão
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login$|^/$).*)",
  ],
};

// Configuração do runtime - explicitamente usar Edge Runtime
export const runtime = 'edge';
