// Inject DATABASE_URL BEFORE importing db module
import { readFileSync } from "fs";

// Manually parse .env file and set env vars before anything else loads
try {
  const envContent = readFileSync(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { products, categories } from "./src/lib/schema";
import { eq } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;
neonConfig.wsProxy = (host: string) => `${host}/v2`;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function main() {
  console.log("Mulai migrasi kategori produk...");
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);

  const allProducts = await db.select({ id: products.id, oldCategory: products.category }).from(products);
  const uniqueCategories = [...new Set(allProducts.map(p => p.oldCategory).filter(Boolean))];

  console.log(`Ditemukan ${uniqueCategories.length} kategori unik:`, uniqueCategories);

  const categoryMap = new Map<string, string>();

  for (const catName of uniqueCategories) {
    const slug = catName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    let existingCat = existing[0];

    if (!existingCat) {
      console.log(`Membuat kategori baru: ${catName} (${slug})`);
      const result = await db.insert(categories).values({
        name: catName,
        slug,
        isActive: true,
        sortOrder: categoryMap.size,
      }).returning();
      existingCat = result[0];
    } else {
      console.log(`Kategori sudah ada: ${catName}`);
    }

    categoryMap.set(catName, existingCat.id);
  }

  let updatedCount = 0;
  for (const product of allProducts) {
    if (product.oldCategory) {
      const catId = categoryMap.get(product.oldCategory);
      if (catId) {
        await db.update(products).set({ categoryId: catId }).where(eq(products.id, product.id));
        updatedCount++;
      }
    }
  }

  console.log(`Migrasi selesai. Berhasil update ${updatedCount} produk.`);
  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
