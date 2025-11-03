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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Obter token JWT da sessão
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  
  // Se não há token (não autenticado), redirecionar para login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    console.log(`[Middleware] Acesso negado a ${pathname} - redirecionando para login`);
    return NextResponse.redirect(loginUrl);
  }
  
  // Validação adicional: garantir que é login via Google
  if (token.provider !== "google") {
    console.warn(`[Middleware] Token inválido: provider ${token.provider}`);
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Token válido, permitir acesso
  console.log(`[Middleware] Acesso permitido a ${pathname} - user: ${token.email}`);
  return NextResponse.next();
}

// Configuração do matcher - rotas que exigem autenticação (multi-tenant)
export const config = {
  matcher: [
    // Páginas de cursos (todas protegidas)
    "/cursos/:path*",
    
    // Páginas de questões (todas protegidas)
    "/questoes/:path*",
    
    // Galeria de imagens
    "/galeria/:path*",
    
    // Dashboard
    "/dashboard/:path*",
    
    // APIs de cursos (todas protegidas)
    "/api/cursos/:path*",
    
    // APIs de questões (todas protegidas)
    "/api/questoes/:path*",
    
    // APIs de galeria (todas protegidas)
    "/api/galeria/:path*",
    
    // API de blob/upload
    "/api/blob/:path*",
    
    // API de recursos
    "/api/recursos/:path*",
    
    // API de gerar prova
    "/api/gerar-prova/:path*",
    
    // API de correção
    "/api/correcao/:path*",
  ],
};
