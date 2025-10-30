/**
 * Utilitários de autenticação para Server Components
 * 
 * Use estas funções em Server Components para verificar autenticação
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth";
import { redirect } from "next/navigation";

/**
 * Obtém a sessão do usuário em Server Component
 * Retorna null se não houver sessão
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Requer autenticação - redireciona para login se não autenticado
 * Use em páginas que EXIGEM login
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  return session;
}

/**
 * Verifica se o usuário está autenticado
 * Retorna boolean
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}
