/**
 * Utilitários para autenticação e autorização em APIs
 * 
 * Fornece funções para validar sessão e extrair userId de forma consistente
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth";
import { NextResponse } from "next/server";

/**
 * Obtém o userId da sessão ou retorna erro 401
 * Use esta função no início de todas as rotas de API protegidas
 * 
 * @returns userId ou NextResponse com erro 401
 * 
 * @example
 * ```typescript
 * export async function GET() {
 *   const userIdOrError = await getUserIdOrUnauthorized();
 *   if (userIdOrError instanceof NextResponse) return userIdOrError;
 *   const userId = userIdOrError;
 *   // ... usar userId
 * }
 * ```
 */
export async function getUserIdOrUnauthorized(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Não autenticado. Faça login para acessar este recurso." },
      { status: 401 }
    );
  }

  return session.user.id;
}

/**
 * Obtém a sessão completa do usuário
 * @returns Session ou null
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Verifica se o usuário está autenticado
 * @returns true se autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session?.user?.id;
}
