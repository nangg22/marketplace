import 'dotenv/config';
import { db } from './src/lib/db';
import { users } from './src/lib/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Menjalankan seeder untuk akun testing TestSprite...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const testUsers = [
    {
      name: 'Test Customer',
      email: 'example@gmail.com', // TestSprite sering menggunakan email ini
      password: passwordHash,
      role: 'customer' as const,
    },
    {
      name: 'Test Seller',
      email: 'seller@test.com', // Spesifikasi di testsprite_mallpedia.md
      password: passwordHash,
      role: 'seller' as const,
    },
    {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: passwordHash,
      role: 'admin' as const,
    }
  ];

  for (const user of testUsers) {
    try {
      await db.insert(users).values(user);
      console.log(`✅ Berhasil membuat akun: ${user.email} (${user.role})`);
    } catch (e: any) {
      if (e.code === '23505') {
        console.log(`⚠️ Akun ${user.email} sudah ada di database, di-skip.`);
      } else {
        console.error(`❌ Gagal membuat ${user.email}:`, e.message);
      }
    }
  }

  console.log('🎉 Seeding selesai!');
  process.exit(0);
}

seed();
