import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Importando o Overlay da aplicação (o do professor/aluno)
import Overlay from "../../components/Overlay";

export default async function AppLayout({ children }) {
  // Verificação Server-Side de Segurança
  // Garante que o usuário tenha o perfil completo, mesmo se o JWT estiver desatualizado
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  if (session?.user?.id) {
    try {
      const db = await getDb();
      const user = await db.collection("users").findOne({ 
        _id: new ObjectId(session.user.id) 
      });
      
      // Se o usuário existe mas não tem perfil completo, redirecionar para cadastro
      const isProfileComplete = user?.profileComplete === true || user?.isProfileComplete === true || user?.profileCompleted === true;
      
      if (!isProfileComplete) {
        console.log(`[AppLayout] 🔒 Bloqueio Server-Side: Perfil incompleto detectado no DB. Redirecionando para /cadastro.`);
        // O redirect deve ser feito aqui, e o erro NEXT_REDIRECT será lançado
        // Precisamos garantir que ele não seja engolido pelo catch abaixo
      }
    } catch (error) {
      console.error("[AppLayout] Erro ao verificar perfil:", error);
      // Se for erro de redirecionamento, relançar para o Next.js tratar
      if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
    }
    
    // Verificação fora do try/catch para evitar problemas com o redirect
    // Mas como precisamos do DB, a lógica acima é necessária.
    // Apenas relançando o erro já resolve.
    
    // Re-verificando para fazer o redirect limpo se possível (mas user scope está no try)
    // Vamos simplificar:
  }
  
  // Nova implementação mais limpa:
  if (session?.user?.id) {
    let shouldRedirectToCadastro = false;
    let shouldRedirectToAluno = false;

    try {
      const db = await getDb();
      const user = await db.collection("users").findOne({ 
        _id: new ObjectId(session.user.id) 
      });
      
      const isProfileComplete = user?.profileComplete === true || user?.isProfileComplete === true || user?.profileCompleted === true;
      if (!isProfileComplete) {
        shouldRedirectToCadastro = true;
      } else {
        // Se perfil completo, verificar role
        const role = user?.role || user?.papel;
        if (role === 'ALUNO') {
          shouldRedirectToAluno = true;
        }
        // Se for PROFESSOR, permite acesso.
        // Se não tiver role definida (mas perfil completo?), algo está errado, mas vamos assumir que perfil completo implica ter role.
      }
    } catch (error) {
      console.error("[AppLayout] Erro ao verificar perfil:", error);
    }
    
    if (shouldRedirectToCadastro) {
      redirect('/perfil/cadastro');
    }

    if (shouldRedirectToAluno) {
      redirect('/aluno/dashboard');
    }
  }

  // Este layout aplica o Overlay interno e renderiza
  // qualquer página aninhada (dashboard, questoes, etc.)
  return (
    <Overlay content={children}/>
  );
}