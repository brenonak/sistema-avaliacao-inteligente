/**
 * Middleware de autenticação
 * 
 * Protege rotas sensíveis que exigem login via Google.
 * 
 * ROTAS PROTEGIDAS (matcher):
 * - /cursos/criar - Criar novo curso
 * - /questoes/criar - Criar nova questão
 * - /dashboard - Dashboard do usuário
 * 
 * Para adicionar mais rotas protegidas, edite o array 'matcher' abaixo.
 * 
 * ROTAS PÚBLICAS (não afetadas):
 * - / (landing page)
 * - /cursos (listagem pública)
 * - /cursos/[id] (visualização pública)
 * - /questoes (listagem pública)
 * - /login
 * - /api/* (exceto rotas específicas se necessário)
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

// Configuração do matcher - APENAS rotas que exigem autenticação
export const config = {
  matcher: [
    // Criar curso
    "/cursos/criar",
    // Criar questão
    "/questoes/criar",
    // Dashboard
    "/dashboard",
    // Adicione aqui outras rotas que devem ser protegidas
    // Exemplo: "/cursos/:path*/editar", "/questoes/:path*/editar"
  ],
};
