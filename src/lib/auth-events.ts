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

      // Adiciona o campo isProfileComplete como false quando um novo usuário é criado
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.id) },
        { 
          $set: { 
            isProfileComplete: false,
            profileCompleted: false // mantém compatibilidade com o campo existente
          } 
        }
      );

      console.log(`[Auth] Campo isProfileComplete adicionado para usuário ${user.id}`);
    } catch (error) {
      console.error("[Auth] Erro ao adicionar isProfileComplete:", error);
    } finally {
      await client.close();
    }
  }
};