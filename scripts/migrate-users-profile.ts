/**
 * Script de migração para adicionar campos de perfil em usuários existentes
 * 
 * Este script:
 * 1. Adiciona profileComplete: false para usuários sem role
 * 2. Adiciona profileComplete: true para usuários com role definido
 * 3. Garante compatibilidade com campos antigos (profileCompleted, isProfileComplete)
 * 
 * USO: npx ts-node scripts/migrate-users-profile.ts
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

if (!MONGODB_URI || !MONGODB_DB) {
  console.error('❌ ERRO: MONGODB_URI e MONGODB_DB devem estar definidos em .env.local');
  process.exit(1);
}

async function migrateUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');

    const db = client.db(MONGODB_DB);
    const usersCollection = db.collection('users');

    // Contar total de usuários
    const totalUsers = await usersCollection.countDocuments();
    console.log(`\n📊 Total de usuários no banco: ${totalUsers}`);

    // 1. Adicionar profileComplete: true para usuários com role definido
    const usersWithRole = await usersCollection.updateMany(
      { 
        role: { $exists: true, $ne: null },
        profileComplete: { $ne: true }
      },
      { 
        $set: { 
          profileComplete: true,
          isProfileComplete: true,
          profileCompleted: true
        } 
      }
    );
    console.log(`\n✅ ${usersWithRole.modifiedCount} usuários com role definido marcados como profileComplete: true`);

    // 2. Adicionar profileComplete: false para usuários sem role
    const usersWithoutRole = await usersCollection.updateMany(
      { 
        $or: [
          { role: { $exists: false } },
          { role: null }
        ],
        profileComplete: { $ne: false }
      },
      { 
        $set: { 
          profileComplete: false,
          isProfileComplete: false,
          profileCompleted: false,
          role: null
        } 
      }
    );
    console.log(`✅ ${usersWithoutRole.modifiedCount} usuários sem role marcados como profileComplete: false`);

    // 3. Estatísticas finais
    const stats = {
      complete: await usersCollection.countDocuments({ profileComplete: true }),
      incomplete: await usersCollection.countDocuments({ profileComplete: false }),
      withRole: await usersCollection.countDocuments({ role: { $ne: null } }),
      withoutRole: await usersCollection.countDocuments({ $or: [{ role: null }, { role: { $exists: false } }] })
    };

    console.log(`\n📊 Estatísticas finais:`);
    console.log(`   - Usuários com perfil completo: ${stats.complete}`);
    console.log(`   - Usuários com perfil incompleto: ${stats.incomplete}`);
    console.log(`   - Usuários com role definido: ${stats.withRole}`);
    console.log(`   - Usuários sem role: ${stats.withoutRole}`);

    // 4. Exibir alguns exemplos
    console.log(`\n📋 Exemplos de usuários migrados:`);
    const samples = await usersCollection.find({}).limit(3).toArray();
    samples.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.email || user.name}`);
      console.log(`   - role: ${user.role || 'null'}`);
      console.log(`   - profileComplete: ${user.profileComplete}`);
    });

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔒 Conexão com MongoDB fechada');
  }
}

migrateUsers();
