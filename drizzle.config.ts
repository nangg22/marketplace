import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },  
});

// npx drizzle-kit studio   untuk melihat database lokal
// npx drizzle-kit push   untuk update schema di database
// npx drizzle-kit generate   untuk generate file SQL