import { db } from './src/lib/db';
import { reviews } from './src/lib/schema';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('Truncating reviews table...');
  await db.execute(sql`TRUNCATE TABLE reviews CASCADE`);
  console.log('Done!');
  process.exit(0);
}

run();
