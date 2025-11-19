/**
 * Extensão de tipos do Next-Auth
 * 
 * Adiciona propriedades customizadas aos tipos padrão do Next-Auth
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "ALUNO" | "PROFESSOR" | null;
      profileComplete?: boolean;
    };
    provider?: string;
  }

  interface User {
    id: string;
    role?: "ALUNO" | "PROFESSOR" | null;
    profileComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    provider?: string;
    role?: "ALUNO" | "PROFESSOR" | null;
    profileComplete?: boolean;
  }
}
