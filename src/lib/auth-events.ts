import { MongoClient, ObjectId } from "mongodb";
import { AdapterUser } from "next-auth/adapters";

/**
 * Eventos do adapter do MongoDB para o NextAuth
 */
export const events = {
  createUser: async ({ user }: { user: AdapterUser }) => {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db(process.env.MONGODB_DB);

      // Adiciona os campos de controle de perfil como false quando um novo usuário é criado
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.id) },
        { 
          $set: { 
            profileComplete: false,
            isProfileComplete: false, // mantém compatibilidade
            profileCompleted: false,  // mantém compatibilidade
            role: null
          } 
        }
      );

      console.log(`[Auth] Campos de perfil inicializados para usuário ${user.id} (profileComplete: false, role: null)`);
    } catch (error) {
      console.error("[Auth] Erro ao inicializar campos de perfil:", error);
    } finally {
      await client.close();
    }
  }
};