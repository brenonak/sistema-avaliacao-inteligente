/**
 * Route handler do Next-Auth
 * 
 * Reexporta os handlers GET/POST da configuração central em auth.ts
 * Runtime: Node.js (necessário para MongoDB driver)
 */

import NextAuth from "next-auth";
import { authOptions } from "../../../../../auth";

// Força runtime Node.js
export const runtime = "nodejs";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };